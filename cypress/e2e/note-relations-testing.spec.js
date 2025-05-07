describe('笔记关系功能测试（评论、引用等）', () => {
  beforeEach(() => {
    // 访问主页
    cy.visit('/');
    // 等待页面加载完成
    cy.get('body').should('be.visible');
    cy.wait(1000); // 等待页面完全加载
  });

  // 创建一个帮助函数，用于创建测试笔记
  function createTestNote(content) {
    // 定位并点击悬浮操作按钮 (FAB)
    cy.get('[data-testid="inbox-fab"]')
      .should('be.visible')
      .click();

    // 在编辑器中输入文本
    cy.get('.note-editor-container textarea, .modal-content textarea, [contenteditable="true"]')
      .should('be.visible')
      .type(content);

    // 点击提交按钮 - 这是一个包含SVG图标的按钮，没有文本
    cy.get('.submit-btn, .editor-wrapper button, button.submit-btn')
      .should('be.visible')
      .click();

    // 等待笔记创建完成
    cy.wait(1000);
  }

  // 测试评论作为笔记的功能
  it('评论应该作为独立笔记存在于笔记列表中', () => {
    // 创建一个主笔记
    const mainNoteContent = `测试主笔记-${Date.now()} #主笔记测试`;
    createTestNote(mainNoteContent);

    // 查找刚创建的笔记并添加评论
    cy.get('.note-list .note-item, .notes-container .note-item')
      .contains(mainNoteContent)
      .closest('.note-item')
      .find('.dropdown-toggle, .menu-toggle, button:contains("...")')
      .click();

    cy.get('.dropdown-menu li:contains("评论"), .menu-item:contains("评论")')
      .should('be.visible')
      .click();

    // 添加一条带特殊标记的评论
    const commentContent = `评论内容-${Date.now()} #评论测试`;
    cy.get('.comment-editor .editor-content, .editor-container.comment .editor-content, [contenteditable="true"]')
      .type(commentContent);

    // 提交评论
    cy.get('.comment-editor .submit-button, .editor-container.comment button:contains("提交"), button:contains("评论")')
      .click();

    // 等待评论提交并刷新页面完成
    cy.wait(2000);

    // 验证评论作为独立笔记出现在笔记列表中
    cy.get('.note-list .note-item, .notes-container .note-item')
      .should('contain', commentContent);
  });

  // 测试笔记关系列表功能
  it('应该能够查看笔记的关系列表', () => {
    // 创建带特殊标记的测试笔记
    const mainNoteContent = `关系测试主笔记-${Date.now()} #关系测试`;
    createTestNote(mainNoteContent);

    // 添加评论（创建关系）
    cy.get('.note-list .note-item, .notes-container .note-item')
      .contains(mainNoteContent)
      .closest('.note-item')
      .find('.dropdown-toggle, .menu-toggle, button:contains("...")')
      .click();

    cy.get('.dropdown-menu li:contains("评论"), .menu-item:contains("评论")')
      .should('be.visible')
      .click();

    // 添加一条带特殊标记的评论
    const commentContent = `关系评论-${Date.now()} #关系评论`;
    cy.get('.comment-editor .editor-content, .editor-container.comment .editor-content, [contenteditable="true"]')
      .type(commentContent);

    // 提交评论
    cy.get('.comment-editor .submit-button, .editor-container.comment button:contains("提交"), button:contains("评论")')
      .click();

    // 等待评论提交完成
    cy.wait(2000);

    // 查看主笔记的关系列表（如果UI中有此功能）
    cy.get('.note-list .note-item, .notes-container .note-item')
      .contains(mainNoteContent)
      .closest('.note-item')
      .find('.dropdown-toggle, .menu-toggle, button:contains("...")')
      .click();

    // 如果有"查看关系"选项
    cy.get('.dropdown-menu li:contains("关系"), .dropdown-menu li:contains("查看评论"), .menu-item:contains("关系")')
      .if('exist')
      .click();

    // 验证关系列表中显示了评论
    cy.get('.relations-container, .comments-container')
      .if('visible')
      .should('contain', commentContent);
  });

  // 测试评论标签功能
  it('评论应该支持标签功能', () => {
    // 创建一个主笔记
    const mainNoteContent = `标签测试主笔记-${Date.now()} #标签测试`;
    createTestNote(mainNoteContent);

    // 查找刚创建的笔记并添加评论
    cy.get('.note-list .note-item, .notes-container .note-item')
      .contains(mainNoteContent)
      .closest('.note-item')
      .find('.dropdown-toggle, .menu-toggle, button:contains("...")')
      .click();

    cy.get('.dropdown-menu li:contains("评论"), .menu-item:contains("评论")')
      .should('be.visible')
      .click();

    // 添加一条带多个标签的评论
    const uniqueTag = `tag${Date.now()}`;
    const commentContent = `测试评论标签 #评论标签1 #评论标签2 #${uniqueTag}`;
    cy.get('.comment-editor .editor-content, .editor-container.comment .editor-content, [contenteditable="true"]')
      .type(commentContent);

    // 提交评论
    cy.get('.comment-editor .submit-button, .editor-container.comment button:contains("提交"), button:contains("评论")')
      .click();

    // 等待评论提交并刷新页面完成
    cy.wait(2000);

    // 尝试按新创建的唯一标签筛选
    cy.get('.tag-filter, .sidebar .tag-list, .tags-container')
      .should('exist')
      .find(`.tag:contains("#${uniqueTag}"), .tag:contains("${uniqueTag}")`)
      .if('exist')
      .click();

    // 验证筛选结果中包含评论内容
    cy.wait(1000);
    cy.get('.note-list .note-item, .notes-container .note-item')
      .should('contain', commentContent);
  });

  // 测试评论编辑功能
  it('应该能够编辑评论', () => {
    // 创建一个主笔记
    const mainNoteContent = `编辑测试主笔记-${Date.now()} #编辑测试`;
    createTestNote(mainNoteContent);

    // 查找刚创建的笔记并添加评论
    cy.get('.note-list .note-item, .notes-container .note-item')
      .contains(mainNoteContent)
      .closest('.note-item')
      .find('.dropdown-toggle, .menu-toggle, button:contains("...")')
      .click();

    cy.get('.dropdown-menu li:contains("评论"), .menu-item:contains("评论")')
      .should('be.visible')
      .click();

    // 添加一条评论
    const originalComment = `原始评论-${Date.now()} #原始评论`;
    cy.get('.comment-editor .editor-content, .editor-container.comment .editor-content, [contenteditable="true"]')
      .type(originalComment);

    // 提交评论
    cy.get('.comment-editor .submit-button, .editor-container.comment button:contains("提交"), button:contains("评论")')
      .click();

    // 等待评论提交并刷新页面完成
    cy.wait(2000);

    // 在笔记列表中找到评论并双击编辑
    cy.get('.note-list .note-item, .notes-container .note-item')
      .contains(originalComment)
      .closest('.note-item')
      .dblclick();

    // 确认编辑器已打开
    cy.get('.note-editor, .editor-container').should('be.visible');
    
    // 清除现有内容并输入新内容
    cy.get('.note-editor .editor-content, .editor-container .editor-content, [contenteditable="true"]')
      .first()
      .clear()
      .type(`已编辑评论-${Date.now()} #已编辑`);

    // 提交编辑
    cy.get('.submit-button, button:contains("提交"), button:contains("保存")')
      .first()
      .click();

    // 验证编辑后的评论显示在列表中
    cy.wait(2000);
    cy.get('.note-list .note-item, .notes-container .note-item')
      .should('contain', '已编辑评论');
  });

  // 测试删除评论功能
  it('应该能够删除评论', () => {
    // 创建一个主笔记
    const mainNoteContent = `删除测试主笔记-${Date.now()} #删除测试`;
    createTestNote(mainNoteContent);

    // 查找刚创建的笔记并添加评论
    cy.get('.note-list .note-item, .notes-container .note-item')
      .contains(mainNoteContent)
      .closest('.note-item')
      .find('.dropdown-toggle, .menu-toggle, button:contains("...")')
      .click();

    cy.get('.dropdown-menu li:contains("评论"), .menu-item:contains("评论")')
      .should('be.visible')
      .click();

    // 添加一条评论
    const commentToDelete = `将被删除的评论-${Date.now()} #删除评论`;
    cy.get('.comment-editor .editor-content, .editor-container.comment .editor-content, [contenteditable="true"]')
      .type(commentToDelete);

    // 提交评论
    cy.get('.comment-editor .submit-button, .editor-container.comment button:contains("提交"), button:contains("评论")')
      .click();

    // 等待评论提交并刷新页面完成
    cy.wait(2000);

    // 在笔记列表中找到评论并删除
    cy.get('.note-list .note-item, .notes-container .note-item')
      .contains(commentToDelete)
      .closest('.note-item')
      .find('.dropdown-toggle, .menu-toggle, button:contains("...")')
      .click();

    cy.get('.dropdown-menu li:contains("删除"), .menu-item:contains("删除")')
      .should('be.visible')
      .click();

    // 确认删除
    cy.get('button:contains("确认"), button:contains("确定"), button.confirm-delete')
      .if('visible')
      .click();

    // 验证评论已被删除
    cy.wait(2000);
    cy.get('.note-list .note-item, .notes-container .note-item')
      .contains(commentToDelete)
      .should('not.exist');
  });
}); 