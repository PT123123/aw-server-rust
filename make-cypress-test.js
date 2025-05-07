// 无头Cypress测试启动脚本
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 检查测试服务器是否正在运行
function isServerRunning(port) {
  try {
    const output = execSync(`lsof -i:${port}`).toString();
    return output.includes('LISTEN');
  } catch (e) {
    return false;
  }
}

// 启动本地测试服务器
function startTestServer() {
  console.log('正在启动测试服务器...');
  
  // 使用http-server或其他简单的静态文件服务器
  // 首先检查是否安装了http-server
  try {
    execSync('which http-server');
  } catch (e) {
    console.log('没有找到http-server，正在安装...');
    execSync('npm install -g http-server');
  }
  
  // 启动http-server
  const server = spawn('http-server', ['.', '-p', '8080'], {
    stdio: 'inherit',
    shell: true
  });
  
  server.on('error', (err) => {
    console.error('启动服务器时出错:', err);
    process.exit(1);
  });
  
  return server;
}

// 在无头模式下运行Cypress测试
function runCypressTests() {
  console.log('正在运行Cypress测试...');
  
  const cypress = spawn('npx', ['cypress', 'run', '--headless'], {
    stdio: 'inherit',
    shell: true
  });
  
  cypress.on('error', (err) => {
    console.error('运行Cypress时出错:', err);
    process.exit(1);
  });
  
  cypress.on('close', (code) => {
    console.log(`Cypress测试完成，退出码: ${code}`);
    process.exit(code);
  });
}

// 检查测试应用文件是否在正确位置
function checkTestApp() {
  const testAppPath = path.join(__dirname, 'cypress', 'test-app.html');
  if (!fs.existsSync(testAppPath)) {
    console.error('错误: 未找到测试应用页面，请确保cypress/test-app.html存在');
    process.exit(1);
  }
  console.log('测试应用页面检查通过');
}

// 主流程
console.log('准备启动无头Cypress测试...');

// 检查环境
checkTestApp();

// 检查服务器是否已在运行
const serverPort = 8080;
let server = null;

if (!isServerRunning(serverPort)) {
  server = startTestServer();
  // 等待服务器启动
  console.log(`等待测试服务器在端口 ${serverPort} 启动...`);
  setTimeout(() => {
    runCypressTests();
  }, 3000);
} else {
  console.log(`测试服务器已在端口 ${serverPort} 运行`);
  runCypressTests();
}

// 处理进程退出
process.on('SIGINT', () => {
  console.log('检测到Ctrl+C，正在清理...');
  if (server) {
    server.kill();
  }
  process.exit(0);
});

process.on('exit', () => {
  if (server) {
    server.kill();
  }
}); 