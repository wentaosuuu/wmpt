import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import os from 'node:os'

const MOBILE_PORT = 5173
const ADMIN_PORT = 5174
const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')

function getLanIPv4() {
  const nets = os.networkInterfaces()
  for (const entries of Object.values(nets)) {
    if (!entries) continue
    for (const net of entries) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return null
}

const lan = getLanIPv4()

console.log('\n========================================')
console.log('  wmpt 高保真原型已准备启动')
console.log('========================================')
console.log('本机访问：')
console.log(`  移动端 H5 : http://localhost:${MOBILE_PORT}`)
console.log(`  后台管理端: http://localhost:${ADMIN_PORT}`)
if (lan) {
  console.log('\n局域网访问（发给同事）：')
  console.log(`  移动端 H5 : http://${lan}:${MOBILE_PORT}`)
  console.log(`  后台管理端: http://${lan}:${ADMIN_PORT}`)
  console.log('\n提示：同事需与你在同一 Wi-Fi / 局域网，并允许本机防火墙放行上述端口。')
} else {
  console.log('\n未检测到局域网 IPv4，同事可尝试使用本机 IP 访问。')
}
console.log('========================================\n')

const child = spawn(
  'npx concurrently -n mobile,admin -c cyan,magenta "npm -w mobile run dev" "npm -w admin run dev"',
  {
    stdio: 'inherit',
    shell: true,
    cwd: rootDir,
  },
)

child.on('exit', (code) => {
  process.exit(code ?? 0)
})
