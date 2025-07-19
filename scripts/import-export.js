// import-export.js - 数据导入导出
class DataHandler {
  constructor(db) {
    this.db = db;
  }

  // 导出角色数据为JSON文件
  async exportCharacter(id) {
    const characters = await this.db.getAllCharacters();
    const character = characters.find(c => c.id === id);
    if (!character) throw new Error('角色不存在');

    const dataStr = JSON.stringify(character, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `GOG角色档案_${character.name}.json`;
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  // 导出为PDF
  async exportToPDF(id) {
    const element = document.getElementById('main-container');
    const toast = document.getElementById('toast');

    // 显示加载提示
    toast.textContent = '正在生成PDF...';
    toast.className = 'toast-visible';

    // 临时隐藏不需要的元素
    const elementsToHide = document.querySelectorAll('.bottom-nav, #toast, .roster-panel');
    elementsToHide.forEach(el => el.style.visibility = 'hidden');

    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');

      // 1. 定义要分段渲染的部分
      const sections = element.querySelectorAll('.section'); // 获取所有区块

      // 2. 设置PDF样式和初始位置
      let yPosition = 15; // 初始Y位置(mm)
      const pageWidth = pdf.internal.pageSize.getWidth() - 20; // 页面宽度减去边距
      const maxPageHeight = pdf.internal.pageSize.getHeight() - 20; // 最大页面高度

      // 4. 分段处理每个区块
      for (let i = 0; i < sections.length; i++) {
        let section = (i === 4) ? element.querySelector('.equipment-inventory-container') : sections[i];

        // 临时显示当前区块(确保滚动到正确位置)
        section.style.visibility = 'visible';
        section.scrollIntoView({ behavior: 'instant', block: 'start' });

        // 等待浏览器重绘
        await new Promise(resolve => setTimeout(resolve, 100));

        // 渲染当前区块为canvas
        const canvas = await html2canvas(section, {
          scale: 1,
          logging: true,
          useCORS: true,
          backgroundColor: '#FFFFFF',
          windowHeight: element.scrollHeight + 50, // 额外增加高度
          ignoreElements: function (el) {
            return false;
          },
          onclone: function (clonedDoc) {
            // 克隆文档时调整输入框样式
            clonedDoc.querySelectorAll('input, textarea').forEach(input => {
              input.style.padding = '8px';
              input.style.lineHeight = '1.5';
              input.style.height = 'auto';
              input.style.boxSizing = 'border-box';
            });

            clonedDoc.querySelectorAll('select').forEach(select => {
              // 强制展开select样式
              select.style.height = 'auto';
              select.style.padding = '10px';
              select.style.lineHeight = '1.5';
              select.style.appearance = 'none';
              select.style.WebkitAppearance = 'none';
              select.style.MozAppearance = 'none';
              select.style.borderRadius = '4px';
              select.style.boxShadow = 'none';

              // 为每个option添加样式
              Array.from(select.options).forEach(option => {
                option.style.padding = '8px';
                option.style.backgroundColor = '#fff';
              });
            });
          }
        });

        // 计算图片尺寸(保持比例)
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = pageWidth;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

        // 检查当前页剩余空间是否足够
        if (yPosition + imgHeight > maxPageHeight) {
          pdf.addPage(); // 添加新页
          yPosition = 15; // 重置Y位置
        }

        // 添加图片到PDF
        pdf.addImage(
          imgData,
          'JPEG',
          10, // x位置(左margin)
          yPosition,
          imgWidth,
          imgHeight
        );

        yPosition += imgHeight + 10; // 更新Y位置并添加间距

        // 恢复区块样式
        section.style.visibility = '';

        if (i === 4) {
          i++;
        }
      }

      // 5. 保存PDF
      const charName = document.getElementById('character-name').value || '未命名角色';
      pdf.save(`GOG角色档案_${charName}.pdf`);

    } catch (err) {
      console.error('分段导出PDF失败:', err);
      toast.textContent = 'PDF导出失败！';
    } finally {
      // 恢复隐藏的元素
      elementsToHide.forEach(el => el.style.visibility = 'visible');
      setTimeout(() => { toast.className = 'toast-hidden'; }, 2000);
    }
  }

  // 批量导出所有角色
  async exportAllCharacters() {
    const characters = await this.db.getAllCharacters();
    const dataStr = JSON.stringify(characters, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `GOG角色_全部导出.json`;
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  // 从JSON文件导入角色
  async importCharacter(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const content = event.target.result;
          if (!content) {
            throw new Error('文件内容为空');
          }

          // 解析JSON数据
          let data;
          try {
            data = JSON.parse(content);
          } catch (e) {
            throw new Error('无效的JSON格式');
          }

          // 处理单角色或多角色导入
          let importedCount = 0;
          if (Array.isArray(data)) {
            // 批量导入多个角色
            if (data.length === 0) {
              throw new Error('导入文件不包含任何角色数据');
            }

            // 依次导入每个角色
            for (const characterData of data) {
              try {
                await this.importSingleCharacter(characterData);
                importedCount++;
              } catch (err) {
                console.warn(`角色导入失败: ${err.message}`);
                // 继续导入其他角色
              }
            }
          } else {
            // 单个角色导入
            await this.importSingleCharacter(data);
            importedCount = 1;
          }

          resolve(importedCount);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }

  /**
   * 导入单个角色数据
   * @param {Object} characterData 角色数据对象
   */
  async importSingleCharacter(characterData) {
    // 验证数据格式
    if (!characterData.name || !characterData.attributes) {
      throw new Error('无效的角色数据格式 - 缺少必要字段');
    }

    // 创建新角色对象
    const character = new Character(characterData);
    character.id = null; // 确保创建新记录

    // 保存到数据库
    await this.db.saveCharacter(character);
  }
};
