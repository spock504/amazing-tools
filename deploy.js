const { program } = require('commander');

const chalk = require('chalk')
const ora = require('ora')
const inquirer = require('inquirer')
const childProcess = require('child_process');
const fs = require('fs');
const archiver = require('archiver');
const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH()

const maxBuffer = 5120 * 1024
let taskList = [] // 任务队列

const config = {
  dev: {
    host: '119.23.**.***',
    port: 888,
    username: 'root',
    password: '****',
    local: 'build',
    remote: '/usr/local/nginx/html/test', // 服务器部署路径（不可为空或'/'）
    script: 'yarn build',
  },
  test: {
    host: '47.106.**.***',',
    port: 888,
    username: 'root',
    password: '****',
    local: 'build',
    remote: '/usr/local/nginx/html/test', // 服务器部署路径（不可为空或'/'）
    script: 'yarn build',
  }
}

// 成功信息
const succeed = (message) => {
  ora().succeed(chalk.greenBright.bold(message))
}
// 提示信息
const info = (message) => {
  ora().info(chalk.blueBright.bold(message))
}
// 错误信息
const error = (message) => {
  ora().fail(chalk.redBright.bold(message))
}
// 下划线重点信息
const underline = (message) => {
  return chalk.underline.blueBright.bold(message)
}


// 执行打包
async function execBuild(sshConfig, index) {
  const spinner = ora('正在打包中...\n')
  spinner.start()
  const { script } = sshConfig
  return new Promise((resolve, reject) => {
    childProcess.exec(script, {
      cwd: process.cwd(),
      maxBuffer: maxBuffer,
    }, (error, stdout, stderr) => {
      spinner.stop()
      if (error) {
        error(`打包出错: ${error}`)
        reject(error)
        return;
      }
      succeed(`${index}. 打包成功`)
      resolve(stdout)
    })
  })
}

// 压缩文件
async function buildZip(sshConfig, index) {
  const { local } = sshConfig
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(`${process.cwd()}/${local}.zip`);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });
    output.on('close', function (e) {
      if (e) {
        error(`压缩失败${e}`)
        reject(e)
      } else {
        succeed(`${index}. 压缩成功`)
        resolve()
      }
    });
    archive.pipe(output);
    archive.directory(local, false)
    archive.finalize();
  })
}

// 连接服务器
async function connectSSH(sshConfig, index) {
  try {
    await ssh.connect(sshConfig)
    succeed(`${index}. ssh连接成功`)
  } catch (e) {
    error('连接失败')
    process.exit(1)
  }
}

// 上传文件
async function putFileRemote(sshConfig, index) {
  try {
    const { local, remote } = sshConfig
    const spinner = ora('正在上传中...\n')
    spinner.start()
    await ssh.putFile(`${process.cwd()}/${local}.zip`, `${remote}.zip`, null, { concurrency: 1 })
    spinner.stop()
    succeed(`${index}. 文件成功上传ssh`)
  } catch (e) {
    console.log(e)
    error(`文件上传ssh失败${e}`)
    process.exit(1)
  }
}

// 删除服务端文件
async function removeRemoteFile(sshConfig, index) {
  try {
    const { local, remote } = sshConfig
    const spinner = ora('正在删除服务端文件中...\n')
    spinner.start()
    await ssh.execCommand(`rm -rf ${remote}/static`)
    spinner.stop()
    succeed(`${index}. 删除服务端文件成功`)
  } catch (e) {
    error(`删除服务端文件失败${e}`)
    process.exit(1)
  }
}

// 解压服务端文件
async function unzipRemoteFile(sshConfig, index) {
  try {
    const { local, remote } = sshConfig
    const zipFileName = `${remote}.zip`
    const spinner = ora('正在解压服务端文件中...\n')
    spinner.start()
    await ssh.execCommand(`unzip  -o ${zipFileName} -d ${remote} && rm -rf ${zipFileName}`)
    spinner.stop()
    succeed(`${index}. 解压服务端文件成功`)
  } catch (e) {
    error(`解压服务端文件失败${e}`)
    process.exit(1)
  }
}

// 删除本地文件
async function removeLocalFile(sshConfig, index) {
  try {
    const { local } = sshConfig
    const localFileName = `${local}.zip`
    await fs.unlinkSync(localFileName)
    succeed(`${index}. 删除本地文件成功`)
  } catch (e) {
    error(`删除本地文件失败${e}`)
    process.exit(1)
  }
}

// 断开连接
async function disconnectSSH(sshConfig, index) {
  try {
    await ssh.dispose()
    succeed(`${index}. 成功断开连接`)
  } catch (e) {
    error(`断开连接失败${e}`)
    process.exit(1)
  }
}

// 任务执行队列
function handleTaskList() {
  taskList.push(execBuild)
  taskList.push(buildZip)
  taskList.push(connectSSH)
  taskList.push(putFileRemote)
  taskList.push(removeRemoteFile)
  taskList.push(unzipRemoteFile)
  taskList.push(removeLocalFile)
  taskList.push(disconnectSSH)
}

// 执行任务队列
async function executeTaskList(sshConfig) {
  for (let index = 0; index < taskList.length; index++) {
    const exectue = taskList[index];
    await exectue(sshConfig, index + 1)
  }
}

// 检查环境配置
function checkEnvCorrect(sshConfig, mode) {
  const keys = [,
    'host',
    'port',
    'username',
    'password',
    'local',
    'remote',
    'script'
  ]
  keys.forEach((item) => {
    const key = sshConfig[item]
    if (!key || key === '/') {
      error(`配置错误: ${underline(`${mode}环境`)} ${underline(`${item}属性`)} 配置不正确`)
      process.exit(1)
    }
  })
}




const main = async (mode) => {
  if (mode) {
    const answer = await inquirer.prompt([{
      type: 'confirm',
      message: '是否进行部署？',
      name: 'confirm', // 交互的关键字，如果有多条数据可以在这边获取到
    }])
    const currentTime = new Date().getTime()
    if (answer.confirm) {
      const sshConfig = config[mode]
      checkEnvCorrect(sshConfig, mode)
      handleTaskList()
      await executeTaskList(sshConfig)
      const nowTime = new Date().getTime()
      succeed(`🎉🎉🎉恭喜，项目部署成功，耗时${(nowTime - currentTime) / 1000}s \n`)
      process.exit(0)
    } else {
      info('取消部署')
    }
  } else {
    error('请配置部署环境 --mode')
    process.exit(1)
  }
}



program
  .option('-m, --mode <type>', 'add the specified type of dev', 'dev')
  .action((options) => {
    // console.log(options.mode);
    main(options.mode)
  });;

program.parse(process.argv);

// console.log(`mode: ${program.mode}`);