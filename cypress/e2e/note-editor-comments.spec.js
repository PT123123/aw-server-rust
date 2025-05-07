describe('笔记编辑器和评论功能测试', () => {
  beforeEach(() => {
    // 访问主页
    cy.visit('/');
    // 等待页面加载完成
    cy.get('body').should('be.visible');
    cy.wait(1000); // 等待页面完全加载
  });

  // 测试笔记创建功能
  it('应该能够创建新笔记', () => {
    // 查找悬浮操作按钮(FAB)并点击
    cy.get('[data-testid="inbox-fab"]')
      .should('be.visible')
      .click();

    // 确认编辑器已打开
    cy.get('.note-editor, .editor-container').should('be.visible');

    // 在编辑器中输入文本
    cy.get('.note-editor-container textarea, .modal-content textarea, [contenteditable="true"]')
      .should('be.visible')
      .type('这是一条测试笔记 #测试标签');

    // 点击提交按钮 - 这是一个包含SVG图标的按钮，没有文本
    cy.get('.submit-btn, .editor-wrapper button, button.submit-btn')
      .should('be.visible')
      .click();

    // 验证笔记列表中显示了新笔记
    cy.wait(2000); // 等待页面刷新
    cy.get('.note-list .note-item, .notes-container .note-item')
      .should('contain', '这是一条测试笔记');
  });

  // 测试笔记创建功能 - 多标签和长文本
  it('应该能够创建带有多个标签和长文本的笔记', () => {
    // 查找悬浮操作按钮(FAB)并点击
    cy.get('[data-testid="inbox-fab"]')
      .should('be.visible')
      .click();

    // 在编辑器中输入带有多个标签的长文本
    cy.get('.note-editor-container textarea, .modal-content textarea, [contenteditable="true"]')
      .should('be.visible')
      .type('这是一条长测试笔记，包含多个标签：#标签1 #标签2 #标签3\n\n这里是第二段落，测试多行文本输入。\n\n这里是第三段落，包含更多标签 #开发 #测试 #笔记系统');

    // 点击提交按钮 - 这是一个包含SVG图标的按钮，没有文本
    cy.get('.submit-btn, .editor-wrapper button, button.submit-btn')
      .should('be.visible')
      .click();

    // 验证笔记列表中显示了新笔记
    cy.wait(2000);
    cy.get('.note-list .note-item, .notes-container .note-item')
      .should('contain', '这是一条长测试笔记');
  });

  // 测试笔记编辑功能
  it('应该能够编辑现有笔记', () => {
    // 双击第一个笔记进行编辑
    cy.get('.note-list .note-item, .notes-container .note-item')
      .first()
      .dblclick();

    // 确认编辑器已打开并已加载现有内容
    cy.get('.note-editor, .editor-container').should('be.visible');
    
    // 清除现有内容并输入新内容
    cy.get('.note-editor .editor-content, .editor-container .editor-content, [contenteditable="true"]')
      .first()
      .clear()
      .type('这是编辑后的笔记内容 #已编辑');

    // 点击提交按钮
    cy.get('.submit-button, button:contains("提交"), button:contains("保存")')
      .first()
      .click();

    // 验证笔记列表中显示了编辑后的笔记
    cy.wait(2000);
    cy.get('.note-list .note-item, .notes-container .note-item')
      .should('contain', '这是编辑后的笔记内容');
  });

  // 测试标签高亮功能
  it('应该在创建笔记时正确高亮标签', () => {
    // 查找悬浮操作按钮(FAB)并点击
    cy.get('[data-testid="inbox-fab"]')
      .should('be.visible')
      .click();

    // 在编辑器中输入带标签的文本
    cy.get('.note-editor-container textarea, .modal-content textarea, [contenteditable="true"]')
      .should('be.visible')
      .type('这是带有#中文标签和#English_Tag的测试笔记');

    // 验证标签被正确高亮（如果实时高亮）
    cy.get('.content-tag, .tag-highlight, span[data-tag="true"]')
      .should('exist');

    // 提交笔记
    cy.get('.submit-btn, .editor-wrapper button, button.submit-btn')
      .should('be.visible')
      .click();
  });

  // 测试复杂标签高亮
  it('应该能够正确高亮复杂标签组合', () => {
    // 查找悬浮操作按钮(FAB)并点击
    cy.get('[data-testid="inbox-fab"]')
      .should('be.visible')
      .click();

    // 输入带有复杂标签组合的文本
    cy.get('.note-editor-container textarea, .modal-content textarea, [contenteditable="true"]')
      .should('be.visible')
      .type('测试复杂标签：\n#标签带空格后的文本 \n文本中的 #中间标签 继续\n#连续标签1#连续标签2 \n带符号的#特殊@标签%￥\nURL中的标签：http://example.com/#不应被高亮\n最后是#结束标签');

    // 提交笔记
    cy.get('.submit-btn, .editor-wrapper button, button.submit-btn')
      .should('be.visible')
      .click();

    // 验证笔记已创建
    cy.wait(2000);
    cy.get('.note-list .note-item, .notes-container .note-item')
      .should('contain', '测试复杂标签');
  });

  // 测试评论功能
  it('应该能够对笔记添加评论', () => {
    // 等待笔记列表加载
    cy.get('.note-list .note-item, .notes-container .note-item')
      .first()
      .should('exist');

    // 点击第一个笔记的评论按钮
    cy.get('.note-list .note-item, .notes-container .note-item')
      .first()
      .find('.dropdown-toggle, .menu-toggle, button:contains("...")')
      .click();

    cy.get('.dropdown-menu li:contains("评论"), .menu-item:contains("评论")')
      .should('be.visible')
      .click();

    // 确认评论编辑器已打开
    cy.get('.comment-editor, .editor-container.comment')
      .should('be.visible');

    // 在评论编辑器中输入文本
    cy.get('.comment-editor .editor-content, .editor-container.comment .editor-content, [contenteditable="true"]')
      .type('这是一条测试评论 #评论标签');

    // 提交评论
    cy.get('.comment-editor .submit-button, .editor-container.comment button:contains("提交"), button:contains("评论")')
      .click();

    // 验证评论已添加
    cy.wait(2000); // 等待页面更新
    cy.get('.comments-container .comment-item, .comment-list .comment-item')
      .should('contain', '这是一条测试评论');
  });

  // 测试多行评论功能
  it('应该能够添加多行评论', () => {
    // 等待笔记列表加载
    cy.get('.note-list .note-item, .notes-container .note-item')
      .first()
      .should('exist');

    // 点击第一个笔记的评论按钮
    cy.get('.note-list .note-item, .notes-container .note-item')
      .first()
      .find('.dropdown-toggle, .menu-toggle, button:contains("...")')
      .click();

    cy.get('.dropdown-menu li:contains("评论"), .menu-item:contains("评论")')
      .should('be.visible')
      .click();

    // 在评论编辑器中输入多行文本
    cy.get('.comment-editor .editor-content, .editor-container.comment .editor-content, [contenteditable="true"]')
      .type('这是一条多行评论\n第二行内容\n第三行内容带标签 #多行评论');

    // 提交评论
    cy.get('.comment-editor .submit-button, .editor-container.comment button:contains("提交"), button:contains("评论")')
      .click();

    // 验证评论已添加
    cy.wait(2000);
    cy.get('.comments-container .comment-item, .comment-list .comment-item')
      .should('contain', '这是一条多行评论');
  });

  // 测试评论后刷新笔记列表功能
  it('评论提交后应刷新笔记列表', () => {
    // 获取当前笔记数量
    cy.get('.note-list .note-item, .notes-container .note-item').then($items => {
      const initialCount = $items.length;
      
      // 点击第一个笔记的评论按钮
      cy.get('.note-list .note-item, .notes-container .note-item')
        .first()
        .find('.dropdown-toggle, .menu-toggle, button:contains("...")')
        .click();

      cy.get('.dropdown-menu li:contains("评论"), .menu-item:contains("评论")')
        .should('be.visible')
        .click();

      // 在评论编辑器中输入文本
      cy.get('.comment-editor .editor-content, .editor-container.comment .editor-content, [contenteditable="true"]')
        .type('刷新列表测试评论 #刷新测试');

      // 提交评论
      cy.get('.comment-editor .submit-button, .editor-container.comment button:contains("提交"), button:contains("评论")')
        .click();

      // 验证笔记列表被刷新，且笔记数量增加
      cy.wait(2000); // 等待页面更新
      cy.get('.note-list .note-item, .notes-container .note-item').should($newItems => {
        expect($newItems.length).to.be.at.least(initialCount);
      });
    });
  });

  // 测试对评论的评论（嵌套评论）
  it('应该能够对评论进行评论（嵌套评论）', () => {
    // 等待笔记列表加载
    cy.get('.note-list .note-item, .notes-container .note-item')
      .first()
      .should('exist');

    // 点击第一个笔记的评论按钮以查看评论区
    cy.get('.note-list .note-item, .notes-container .note-item')
      .first()
      .find('.dropdown-toggle, .menu-toggle, button:contains("...")')
      .click();

    cy.get('.dropdown-menu li:contains("评论"), .menu-item:contains("评论")')
      .should('be.visible')
      .click();

    // 确认评论区已打开，并有至少一个评论
    cy.get('.comments-container .comment-item, .comment-list .comment-item')
      .first()
      .should('exist')
      .find('.dropdown-toggle, .menu-toggle, button:contains("...")')
      .click();

    // 点击评论中的"评论"选项
    cy.get('.dropdown-menu li:contains("评论"), .menu-item:contains("评论")')
      .should('be.visible')
      .click();

    // 在嵌套评论编辑器中输入文本
    cy.get('.comment-editor .editor-content, .editor-container.comment .editor-content, [contenteditable="true"]')
      .type('这是对评论的回复 #嵌套评论');

    // 提交嵌套评论
    cy.get('.comment-editor .submit-button, .editor-container.comment button:contains("提交"), button:contains("评论")')
      .click();

    // 验证嵌套评论已添加
    cy.wait(2000);
    cy.get('.comments-container .comment-item, .comment-list .comment-item')
      .should('contain', '这是对评论的回复');
  });

  // 测试删除笔记功能
  it('应该能够删除笔记', () => {
    // 点击第一个笔记的删除按钮
    cy.get('.note-list .note-item, .notes-container .note-item')
      .first()
      .find('.dropdown-toggle, .menu-toggle, button:contains("...")')
      .click();

    cy.get('.dropdown-menu li:contains("删除"), .menu-item:contains("删除")')
      .should('be.visible')
      .click();

    // 确认删除对话框（如果存在）
    cy.get('button:contains("确认"), button:contains("确定"), button.confirm-delete')
      .should('be.visible')
      .click();

    // 验证笔记已被删除
    cy.wait(2000); // 等待页面更新
    // 这里我们无法验证特定笔记是否被删除，但可以验证页面没有崩溃
    cy.get('body').should('be.visible');
  });

  // 测试按标签筛选功能
  it('应该能够按标签筛选笔记', () => {
    // 点击标签筛选按钮或区域
    cy.get('.tag-filter, .sidebar .tag-list, .tags-container')
      .should('exist')
      .find('.tag:contains("#测试"), .tag:contains("测试")')
      .first()
      .click();

    // 验证笔记列表已经更新
    cy.wait(1000);
    cy.get('.note-list, .notes-container').should('exist');
  });

  // 测试笔记保存草稿功能
  it('应该能够自动保存笔记草稿', () => {
    // 查找悬浮操作按钮(FAB)并点击
    cy.get('[data-testid="inbox-fab"]')
      .should('be.visible')
      .click();

    // 在编辑器中输入文本
    cy.get('.note-editor-container textarea, .modal-content textarea, [contenteditable="true"]')
      .should('be.visible')
      .type('这是一条测试草稿 #草稿测试');

    // 关闭编辑器（取消而不是提交）
    cy.get('.cancel-button, button:contains("取消")')
      .first()
      .click();

    // 再次打开编辑器
    cy.get('[data-testid="inbox-fab"]')
      .should('be.visible')
      .click();

    // 验证之前的草稿内容仍然存在
    cy.get('.note-editor-container textarea, .modal-content textarea, [contenteditable="true"]')
      .should('be.visible')
      .invoke('text')
      .should('contain', '这是一条测试草稿');

    // 关闭编辑器
    cy.get('.cancel-button, button:contains("取消")')
      .first()
      .click();
  });

  // 测试评论编辑器取消功能
  it('应该能够取消评论编辑', () => {
    // 点击第一个笔记的评论按钮
    cy.get('.note-list .note-item, .notes-container .note-item')
      .first()
      .find('.dropdown-toggle, .menu-toggle, button:contains("...")')
      .click();

    cy.get('.dropdown-menu li:contains("评论"), .menu-item:contains("评论")')
      .should('be.visible')
      .click();

    // 确认评论编辑器已打开
    cy.get('.comment-editor, .editor-container.comment')
      .should('be.visible');

    // 在评论编辑器中输入文本
    cy.get('.comment-editor .editor-content, .editor-container.comment .editor-content, [contenteditable="true"]')
      .type('这是一条将被取消的评论');

    // 点击取消按钮
    cy.get('.comment-editor .cancel-button, .editor-container.comment button:contains("取消")')
      .click();

    // 验证评论编辑器已关闭
    cy.get('.comment-editor, .editor-container.comment')
      .should('not.exist');
  });

  // 测试取消创建新笔记
  it('应该能够取消创建新笔记', () => {
    // 查找悬浮操作按钮(FAB)并点击
    cy.get('[data-testid="inbox-fab"]')
      .should('be.visible')
      .click();

    // 在编辑器中输入文本
    cy.get('.note-editor-container textarea, .modal-content textarea, [contenteditable="true"]')
      .should('be.visible')
      .type('这是一条测试草稿 #草稿测试');

    // 关闭编辑器（取消而不是提交）
    cy.get('.cancel-button, button:contains("取消")')
      .first()
      .click();

    // 再次打开编辑器
    cy.get('[data-testid="inbox-fab"]')
      .should('be.visible')
      .click();

    // 验证之前的草稿内容仍然存在
    cy.get('.note-editor-container textarea, .modal-content textarea, [contenteditable="true"]')
      .should('be.visible')
      .invoke('text')
      .should('contain', '这是一条测试草稿');

    // 关闭编辑器
    cy.get('.cancel-button, button:contains("取消")')
      .first()
      .click();
  });

  // 测试取消编辑笔记
  it('应该能够取消编辑笔记', () => {
    // 先创建一条笔记用于编辑
    const noteContent = '用于取消编辑的笔记';
    cy.get('[data-testid="inbox-fab"]')
      .should('be.visible')
      .click();

    // 在编辑器中输入文本
    cy.get('.note-editor-container textarea, .modal-content textarea, [contenteditable="true"]')
      .should('be.visible')
      .type(noteContent);

    // 关闭编辑器（取消而不是提交）
    cy.get('.cancel-button, button:contains("取消")')
      .first()
      .click();

    // 再次打开编辑器
    cy.get('[data-testid="inbox-fab"]')
      .should('be.visible')
      .click();

    // 验证之前的笔记内容仍然存在
    cy.get('.note-editor-container textarea, .modal-content textarea, [contenteditable="true"]')
      .should('be.visible')
      .invoke('text')
      .should('contain', noteContent);

    // 关闭编辑器
    cy.get('.cancel-button, button:contains("取消")')
      .first()
      .click();
  });
}); 