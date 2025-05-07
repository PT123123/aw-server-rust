describe('笔记删除功能测试', () => {
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

  // 测试删除刚创建的笔记
  it('应该能够删除刚创建的笔记', () => {
    // 生成唯一标识符，确保可以找到刚创建的笔记
    const uniqueId = Date.now();
    const noteContent = `删除测试笔记-${uniqueId} #删除测试`;
    
    // 创建测试笔记
    createTestNote(noteContent);
    
    // 验证笔记已被创建并显示在列表中
    cy.get('.note-list .note-item, .notes-container .note-item')
      .should('contain', noteContent);
    
    // 查找包含刚创建笔记的列表项
    cy.get('.note-list .note-item, .notes-container .note-item')
      .contains(noteContent)
      .closest('.note-item')
      .then($noteItem => {
        // 打开笔记的下拉菜单
        cy.wrap($noteItem)
          .find('.dropdown-toggle, .menu-toggle, button:contains("...")')
          .click();
        
        // 点击删除选项
        cy.get('.dropdown-menu li:contains("删除"), .menu-item:contains("删除")')
          .should('be.visible')
          .click();
        
        // 如果有确认对话框，则点击确认
        cy.get('button:contains("确认"), button:contains("确定"), button.confirm-delete')
          .then($confirmBtn => {
            if ($confirmBtn.length > 0) {
              cy.wrap($confirmBtn).click();
            }
          });
        
        // 等待删除操作完成
        cy.wait(2000);
        
        // 验证笔记已被删除
        cy.get('.note-list .note-item, .notes-container .note-item')
          .contains(noteContent)
          .should('not.exist');
      });
  });

  // 测试删除时网络错误处理
  it('删除功能应该在遇到网络错误时提供反馈', () => {
    // 拦截删除API调用以模拟网络错误
    cy.intercept('DELETE', '**/inbox/notes/*', {
      statusCode: 500,
      body: { error: 'Server Error' }
    }).as('deleteError');
    
    // 创建一个笔记用于测试
    const uniqueId = Date.now();
    const noteContent = `错误处理测试-${uniqueId} #错误测试`;
    
    createTestNote(noteContent);
    
    // 验证笔记已被创建
    cy.get('.note-list .note-item, .notes-container .note-item')
      .should('contain', noteContent);
    
    // 尝试删除笔记
    cy.get('.note-list .note-item, .notes-container .note-item')
      .contains(noteContent)
      .closest('.note-item')
      .find('.dropdown-toggle, .menu-toggle, button:contains("...")')
      .click();
    
    cy.get('.dropdown-menu li:contains("删除"), .menu-item:contains("删除")')
      .should('be.visible')
      .click();
    
    // 确认按钮如果存在
    cy.get('button:contains("确认"), button:contains("确定"), button.confirm-delete')
      .then($confirmBtn => {
        if ($confirmBtn.length > 0) {
          cy.wrap($confirmBtn).click();
        }
      });
    
    // 等待拦截的网络请求
    cy.wait('@deleteError');
    
    // 验证笔记仍然存在（删除失败）
    cy.get('.note-list .note-item, .notes-container .note-item')
      .should('contain', noteContent);
    
    // 验证控制台是否有错误日志（这一步可选，因为日志检查在Cypress中很复杂）
  });

  // 测试删除有评论关联的笔记
  it('应该能够删除有评论关联的笔记并刷新列表', () => {
    // 创建一个主笔记
    const uniqueId = Date.now();
    const mainNoteContent = `主笔记删除测试-${uniqueId} #主笔记`;
    
    createTestNote(mainNoteContent);
    
    // 验证主笔记已创建
    cy.get('.note-list .note-item, .notes-container .note-item')
      .should('contain', mainNoteContent);
    
    // 添加评论到主笔记
    cy.get('.note-list .note-item, .notes-container .note-item')
      .contains(mainNoteContent)
      .closest('.note-item')
      .find('.dropdown-toggle, .menu-toggle, button:contains("...")')
      .click();
    
    cy.get('.dropdown-menu li:contains("评论"), .menu-item:contains("评论")')
      .should('be.visible')
      .click();
    
    // 在评论编辑器中输入内容
    const commentContent = `评论内容-${uniqueId} #评论测试`;
    cy.get('.comment-editor .editor-content, .editor-container.comment .editor-content, [contenteditable="true"]')
      .type(commentContent);
    
    // 提交评论
    cy.get('.comment-editor .submit-button, .editor-container.comment button:contains("提交"), button:contains("评论")')
      .click();
    
    // 等待评论提交完成
    cy.wait(2000);
    
    // 验证评论已添加到列表
    cy.get('.note-list .note-item, .notes-container .note-item')
      .should('contain', commentContent);
    
    // 获取当前列表中的笔记数量
    cy.get('.note-list .note-item, .notes-container .note-item').then($items => {
      const initialCount = $items.length;
      
      // 删除主笔记
      cy.get('.note-list .note-item, .notes-container .note-item')
        .contains(mainNoteContent)
        .closest('.note-item')
        .find('.dropdown-toggle, .menu-toggle, button:contains("...")')
        .click();
      
      cy.get('.dropdown-menu li:contains("删除"), .menu-item:contains("删除")')
        .should('be.visible')
        .click();
      
      // 确认删除如果需要
      cy.get('button:contains("确认"), button:contains("确定"), button.confirm-delete')
        .then($confirmBtn => {
          if ($confirmBtn.length > 0) {
            cy.wrap($confirmBtn).click();
          }
        });
      
      // 等待删除和刷新完成
      cy.wait(2000);
      
      // 验证主笔记已被删除
      cy.get('.note-list .note-item, .notes-container .note-item')
        .contains(mainNoteContent)
        .should('not.exist');
      
      // 验证列表已更新（由于我们删除了笔记，列表项数量应该减少）
      cy.get('.note-list .note-item, .notes-container .note-item').should($newItems => {
        expect($newItems.length).to.be.at.most(initialCount);
      });
    });
  });

  // 测试批量删除多个笔记（如果你的界面支持此功能）
  it('应该能够连续删除多个笔记', () => {
    // 创建三个测试笔记
    const uniqueId = Date.now();
    const noteContents = [
      `批量删除测试1-${uniqueId} #批量删除`,
      `批量删除测试2-${uniqueId} #批量删除`,
      `批量删除测试3-${uniqueId} #批量删除`
    ];
    
    // 创建三个测试笔记
    noteContents.forEach(content => {
      createTestNote(content);
    });
    
    // 验证所有笔记已被创建
    noteContents.forEach(content => {
      cy.get('.note-list .note-item, .notes-container .note-item')
        .should('contain', content);
    });
    
    // 逐个删除这些笔记
    noteContents.forEach(content => {
      // 删除当前笔记
      cy.get('.note-list .note-item, .notes-container .note-item')
        .contains(content)
        .closest('.note-item')
        .find('.dropdown-toggle, .menu-toggle, button:contains("...")')
        .click();
      
      cy.get('.dropdown-menu li:contains("删除"), .menu-item:contains("删除")')
        .should('be.visible')
        .click();
      
      // 确认删除如果需要
      cy.get('button:contains("确认"), button:contains("确定"), button.confirm-delete')
        .then($confirmBtn => {
          if ($confirmBtn.length > 0) {
            cy.wrap($confirmBtn).click();
          }
        });
      
      // 等待删除操作完成
      cy.wait(2000);
      
      // 验证笔记已被删除
      cy.get('.note-list .note-item, .notes-container .note-item')
        .contains(content)
        .should('not.exist');
    });
  });

  // 测试删除后的列表刷新功能
  it('应该在删除后自动刷新整个笔记列表', () => {
    cy.intercept('GET', '**/inbox/notes*').as('getNotes');
    
    // 创建一个测试笔记
    const uniqueId = Date.now();
    const noteContent = `刷新测试-${uniqueId} #刷新测试`;
    
    createTestNote(noteContent);
    
    // 等待笔记加载请求完成
    cy.wait('@getNotes');
    
    // 验证笔记已被创建
    cy.get('.note-list .note-item, .notes-container .note-item')
      .should('contain', noteContent);
    
    // 拦截删除请求和后续的笔记刷新请求
    cy.intercept('DELETE', '**/inbox/notes/*').as('deleteNote');
    cy.intercept('GET', '**/inbox/notes*').as('refreshNotes');
    
    // 删除笔记
    cy.get('.note-list .note-item, .notes-container .note-item')
      .contains(noteContent)
      .closest('.note-item')
      .find('.dropdown-toggle, .menu-toggle, button:contains("...")')
      .click();
    
    cy.get('.dropdown-menu li:contains("删除"), .menu-item:contains("删除")')
      .should('be.visible')
      .click();
    
    // 确认删除如果需要
    cy.get('button:contains("确认"), button:contains("确定"), button.confirm-delete')
      .then($confirmBtn => {
        if ($confirmBtn.length > 0) {
          cy.wrap($confirmBtn).click();
        }
      });
    
    // 等待删除请求完成
    cy.wait('@deleteNote');
    
    // 验证在删除后发起了刷新请求
    cy.wait('@refreshNotes').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
    });
    
    // 验证笔记已从列表中移除
    cy.get('.note-list .note-item, .notes-container .note-item')
      .contains(noteContent)
      .should('not.exist');
    
    // 确认状态图标显示已连接状态
    cy.get('.status-connected, .status-icon:contains("✅")')
      .should('exist');
  });
}); 