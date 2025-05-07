// ***********************************************************
// This file is processed and loaded automatically before your test files.
// This is a great place to put global configuration and behavior that modifies Cypress.
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// 配置Cypress全局行为
Cypress.on('uncaught:exception', (err, runnable) => {
  // 返回false可以防止Cypress在遇到未捕获的异常时失败测试
  // 通常在测试第三方库时很有用
  return false
})

// 配置超时时间（可选）
Cypress.config('defaultCommandTimeout', 10000)
Cypress.config('responseTimeout', 30000)

// 在每个测试之前的前置处理
beforeEach(() => {
  // 如果需要，可以在这里添加全局的前置处理逻辑
  cy.log('开始执行测试用例')
})

// 在每个测试之后的后置处理
afterEach(() => {
  // 如果需要，可以在这里添加全局的后置处理逻辑
  cy.log('测试用例执行完成')
}) 