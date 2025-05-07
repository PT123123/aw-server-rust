// ***********************************************
// This file can be used to create various custom commands and overwrite existing ones.
// For more comprehensive examples of custom commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// 创建一个应用标签测试的自定义命令
Cypress.Commands.add('applyTagTest', (text) => {
  cy.get('.editor-content').clear();
  cy.get('.editor-content').type(text);
  cy.get('#process-tags').click();
})

// 验证标签高亮的自定义命令
Cypress.Commands.add('verifyTagHighlight', (tagText) => {
  cy.get('.editor-content .tag-highlight[data-tag="true"]').should('contain', tagText);
})

// 验证多个标签的自定义命令
Cypress.Commands.add('verifyMultipleTags', (tagList) => {
  cy.get('.editor-content .tag-highlight[data-tag="true"]').should('have.length', tagList.length);
  
  tagList.forEach((tag, index) => {
    cy.get('.editor-content .tag-highlight[data-tag="true"]').eq(index).should('contain', tag);
  });
})

// 添加自定义的if命令，类似于jQuery的if方法
Cypress.Commands.add('if', { prevSubject: true }, (subject, condition, callback) => {
  if (condition === 'exist') {
    // 检查元素是否存在，如果存在则继续链式调用
    if (subject.length > 0) {
      return cy.wrap(subject);
    }
  } else if (condition === 'visible') {
    // 检查元素是否可见，如果可见则继续链式调用
    if (subject.is(':visible')) {
      return cy.wrap(subject);
    }
  } else if (typeof condition === 'function') {
    // 自定义条件函数
    if (condition(subject)) {
      return cy.wrap(subject);
    }
  }
  
  // 如果条件不满足，返回一个空的jQuery对象
  return cy.wrap(Cypress.$());
});

// 创建一个自定义命令，用于检查元素是否包含特定文本
Cypress.Commands.add('containsText', { prevSubject: 'element' }, (subject, text) => {
  const contains = subject.text().includes(text);
  return cy.wrap(subject).should(() => {
    expect(contains).to.be.true;
  });
});

// 创建一个自定义命令，用于等待元素加载并确保其可见
Cypress.Commands.add('waitAndGet', (selector) => {
  cy.wait(500); // 短暂等待确保DOM更新
  return cy.get(selector).should('exist');
});

// 添加等待并验证URL变化的命令
Cypress.Commands.add('waitForUrlChange', (urlFragment) => {
  cy.url().should('include', urlFragment);
}); 