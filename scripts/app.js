// app.js - 主应用逻辑
class GOGCharacterApp {
    constructor() {
        this.db = new CharacterDB();
        this.dataHandler = new DataHandler(this.db);
        this.currentCharacter = null;
        this.init();
    }

    async init() {
        await this.db.openDB();
        this.renderCharacterList();
        this.setupEventListeners();

        this.currentCharacter = new Character();
        this.renderCharacterDetail(this.currentCharacter);
    }

    // 切换图鉴面板
    toggleRosterPanel() {
        const panel = document.getElementById('roster-panel');
        if (panel.style.display === 'block') {
            this.closeRosterPanel();
        } else {
            this.openRosterPanel();
        }
    }
    openRosterPanel() {
        const panel = document.getElementById('roster-panel');
        panel.style.display = 'block';
        this.renderCharacterList();
    }
    closeRosterPanel() {
        document.getElementById('roster-panel').style.display = 'none';
    }

    // 切换数据面板
    toggleDataPanel() {
        const panel = document.getElementById('data-panel');
        if (panel.style.display === 'block') {
            document.getElementById('data-panel').style.display = 'none';
        } else {
            document.getElementById('data-panel').style.display = 'block';
        }
    }

    // 渲染角色列表
    async renderCharacterList() {
        const characters = await this.db.getAllCharacters();
        const listContainer = document.getElementById('characters-list');

        listContainer.innerHTML = characters.map(char => `
      <div class="roster-item" data-id="${char.id}">
        <div class="roster-avatar" style="background-image: url('${char.portrait || 'default-avatar.jpg'}')"></div>
        <div class="roster-info">
          <h5>${char.name}</h5>
          <p><span>${char.class}</span> <span>${char.blessing}Lv.${char.blessinglevel}</span></p>
        </div>
        <div class="character-actions">
          <button class="btn-load" style="border-radius: 8px 0px 0px 8px ;">加载</button>
          <button class="btn-export" style="border-radius: 0px;">导出</button>
          <button class="btn-delete" style="border-radius: 0px 8px 8px 0px ;">删除</button>
        </div>
      </div>
    `).join('');
    }

    // 通用输入绑定方法
    bindInputToCharacter(inputId, property) {
        const input = document.getElementById(inputId);
        if (!input) return;

        input.value = this.currentCharacter[property] || '';
        input.addEventListener('input', () => {
            this.currentCharacter[property] = input.value;
        });
    }

    // 渲染角色详情
    renderCharacterDetail(character) {

        this.currentCharacter = character;

        this.bindInputToCharacter('character-name', 'name');
        this.bindInputToCharacter('player-name', 'player');
        this.bindInputToCharacter('character-gender', 'gender');
        this.bindInputToCharacter('character-age', 'age');
        this.bindInputToCharacter('character-alignment', 'alignment');
        this.bindInputToCharacter('character-nationality', 'nationality');
        this.bindInputToCharacter('character-class', 'class');
        this.bindInputToCharacter('character-blessing', 'blessing');
        this.bindInputToCharacter('character-description', 'description');
        this.bindInputToCharacter('blessing-level', 'blessinglevel');
        this.bindInputToCharacter('blessing-soul', 'soul');

        // 动态表格绑定
        this.setupTableBindings();

        this.bindAttributeInputs();

        // 渲染属性
        this.renderAttributes(character.attributes);

        this.renderPortrait();

        // 渲染赐福系统
        this.renderBlessingSystem(character.blessingSystem, character.blessing);
        this.renderBlessingSkills(character.blessingSkills);

        // 渲染状态标签
        this.renderStatusTags(character.status);

        // 渲染技能列表
        this.renderSkills(character.skills);
        this.updateSkillProficiencyLeft();

        // 渲染装备列表
        this.renderEquipment(character.equipment);

        // 渲染背包物品
        this.renderInventory(character.inventory);
        this.updateTotalWeight();

    }

    // 渲染属性
    renderAttributes(attributes) {
        // 渲染前6个属性
        ['STR', 'DEX', 'INT', 'CHA', 'WIS', 'MAG'].forEach(attr => {
            const base = parseInt(attributes[attr].base) || 0;
            const statusAdj = parseInt(attributes[attr].statusAdj) || 0;
            const blessingAdj = parseInt(attributes[attr].blessingAdj) || 0;
            document.getElementById(`attr-${attr}-base`).value = base;
            document.getElementById(`attr-${attr}-status`).value = statusAdj;
            document.getElementById(`attr-${attr}-blessing`).value = blessingAdj;
            document.getElementById(`attr-${attr}-total`).textContent = Math.min(20, Math.max(0, base + statusAdj + blessingAdj));
        });

        // 渲染健康和魔力
        this.updateMaxValues();
        this.updateSkillProficiencyLeft();
    }

    // 动态计算属性并显示最大值
    updateMaxValues() {
        // 获取当前页面上的值
        const strBase = parseInt(document.getElementById('attr-STR-base').value) || 0;
        const strStatus = parseInt(document.getElementById('attr-STR-status').value) || 0;
        const strBlessing = parseInt(document.getElementById('attr-STR-blessing').value) || 0;
        const strTotal = Math.min(20, Math.max(0, strBase + strStatus + strBlessing));

        const magBase = parseInt(document.getElementById('attr-MAG-base').value) || 0;
        const magStatus = parseInt(document.getElementById('attr-MAG-status').value) || 0;
        const magBlessing = parseInt(document.getElementById('attr-MAG-blessing').value) || 0;
        const magTotal = Math.min(20, Math.max(magBase + magStatus + magBlessing));

        const hpBase = parseInt(document.getElementById('attr-HP-base').value) || 0;
        const mpBase = parseInt(document.getElementById('attr-MP-base').value) || 0;

        // 计算最大值
        const hpMax = hpBase + strTotal * 2;
        const mpMax = mpBase + magTotal;

        // 更新显示
        document.getElementById('attr-HP-max').textContent = hpMax;
        document.getElementById('attr-MP-max').textContent = mpMax;
        document.getElementById('attr-HP-base').value = hpBase;
        document.getElementById('attr-MP-base').value = mpBase;

        // 限制当前值不超过新最大值
        const hpCurrent = document.getElementById('attr-HP-current');
        if (parseInt(hpCurrent.value) > hpMax) {
            hpCurrent.value = hpMax;
        }

        const mpCurrent = document.getElementById('attr-MP-current');
        if (parseInt(mpCurrent.value) > mpMax) {
            mpCurrent.value = mpMax;
        }

        // 更新血条
        const hpPercent = Math.min(100, (hpCurrent.value / hpMax) * 100);
        const mpPercent = Math.min(100, (mpCurrent.value / mpMax) * 100);
        const hpBasePercent = Math.min(100, (hpBase / hpMax) * 100);
        const mpBasePercent = Math.min(100, (mpBase / mpMax) * 100);

        document.getElementById('hp-bar').style.width = `${hpPercent}%`;
        document.getElementById('mp-bar').style.width = `${mpPercent}%`;
        document.getElementById('hpb-bar').style.width = `${hpBasePercent}%`;
        document.getElementById('mpb-bar').style.width = `${mpBasePercent}%`;
    }

    // 收集属性数据
    collectAttributes() {
        const attributes = {};

        // 收集前6个属性
        ['STR', 'DEX', 'INT', 'CHA', 'WIS', 'MAG'].forEach(attr => {
            attributes[attr] = {
                base: parseInt(document.getElementById(`attr-${attr}-base`).value) || 0,
                statusAdj: parseInt(document.getElementById(`attr-${attr}-status`).value) || 0,
                blessingAdj: parseInt(document.getElementById(`attr-${attr}-blessing`).value) || 0
            };
        });

        // 收集健康和魔力
        attributes.HP = {
            base: parseInt(document.getElementById('attr-HP-base').value) || 0,
            current: parseInt(document.getElementById('attr-HP-current').value) || 0
        };

        attributes.MP = {
            base: parseInt(document.getElementById('attr-MP-base').value) || 0,
            current: parseInt(document.getElementById('attr-MP-current').value) || 0
        };

        return attributes;
    }

    bindAttributeInputs() {
        // 基础6属性
        ['STR', 'DEX', 'INT', 'CHA', 'WIS', 'MAG'].forEach(attr => {
            ['base', 'status', 'blessing'].forEach(type => {
                const input = document.getElementById(`attr-${attr}-${type}`);
                if (!input) return;

                // 设置初始值
                const value = this.currentCharacter.attributes?.[attr]?.[type] || 0;
                input.value = value;

                // 添加事件监听
                input.addEventListener('change', () => {
                    if (!this.currentCharacter.attributes) {
                        this.currentCharacter.attributes = {};
                    }
                    if (!this.currentCharacter.attributes[attr]) {
                        this.currentCharacter.attributes[attr] = {};
                    }

                    this.currentCharacter.attributes[attr][type] = parseInt(input.value) || 0;
                    this.updateMaxValues();
                    this.updateSkillProficiencyLeft();
                });
            });
        });

        // HP/MP 属性
        ['HP', 'MP'].forEach(type => {
            ['base', 'current'].forEach(subType => {
                const input = document.getElementById(`attr-${type}-${subType}`);
                if (!input) return;

                // 设置初始值
                const value = this.currentCharacter.attributes?.[type]?.[subType] || 0;
                input.value = value;

                // 添加事件监听
                input.addEventListener('change', () => {
                    if (!this.currentCharacter.attributes) {
                        this.currentCharacter.attributes = {};
                    }
                    if (!this.currentCharacter.attributes[type]) {
                        this.currentCharacter.attributes[type] = {};
                    }

                    this.currentCharacter.attributes[type][subType] = parseInt(input.value) || 0;
                    this.updateMaxValues();
                });
            });
        });
    }

    setupTableBindings() {
        // 技能表格
        this.setupTableBinding('skills-container', 'skills', ['name', 'proficiency', 'uses', 'description']);

        // 装备表格
        this.setupTableBinding('equipment-container', 'equipment', ['name', 'type', 'modifier', 'description']);

        // 物品表格
        this.setupTableBinding('inventory-container', 'inventory', ['name', 'weight', 'description', 'quantity']);
    }

    setupTableBinding(containerId, property, fields) {
        const container = document.getElementById(containerId);
        container.addEventListener('input', (e) => {
            const row = e.target.closest('tr');
            if (!row) return;

            const index = Array.from(container.children).indexOf(row);
            if (index === -1) return;

            // 更新对应数据
            const inputs = row.querySelectorAll('input, .auto-height-content');
            fields.forEach((field, i) => {
                let value = inputs[i].value;
                if (inputs[i].classList.contains('auto-height-content')) {
                    value = inputs[i].innerText;
                }

                this.currentCharacter[property][index][field] = this.convertFieldValue(field, value);
            });

        });
    }

    // 渲染肖像
    renderPortrait() {
        const portraitImg = document.getElementById('character-portrait');
        const placeholder = document.getElementById('portrait-placeholder');

        if (this.currentCharacter.portrait) {
            portraitImg.src = this.currentCharacter.portrait;
            portraitImg.style.display = 'block';
            placeholder.style.display = 'none';
        } else {
            portraitImg.style.display = 'none';
            placeholder.style.display = 'block';
        }
    }

    // 图片压缩方法
    compressImage(file, maxWidth = 800, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (maxWidth / width) * height;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = reject;
                img.src = event.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 渲染赐福系统表格
    renderBlessingSystem(blessingData, blessing) {
        const blessingLabel = document.getElementById('blessing-system-label');
        if (blessingLabel) {
            blessingLabel.textContent = blessing ? `${blessing}系统` : "赐福系统";
        }

        const container = document.getElementById('blessing-container');
        container.innerHTML = '';

        const data = blessingData || Array(5).fill().map((_, i) => ({
            level: i + 1,
            attribute: '',
            bonus: '',
            skill: '',
            soulWear: 0,
            corruption: ''
        }));

        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td><input type="number" min="1" max="5" value="${row.level}"  style="color: ${index < this.currentCharacter.blessinglevel ? '#333333' : '#aaaaaa'};" readonly></td>
        <td class="auto-height-cell">
            <div class="auto-height-content" contenteditable="true"  style="color: ${index < this.currentCharacter.blessinglevel ? '#333333' : '#aaaaaa'};">${row.attribute || ''}</div>
        </td>
        <td><input type="number" min="0" value="${row.bonus || ''}" style="color: ${index < this.currentCharacter.blessinglevel ? '#333333' : '#aaaaaa'};"></td>
        <td class="auto-height-cell">
            <div class="auto-height-content" contenteditable="true" style="color: ${index < this.currentCharacter.blessinglevel ? '#333333' : '#aaaaaa'};">${row.skill || ''}</div>
        </td>
        <td><input type="number" min="0" value="${row.soulWear || 0}"  style="color: ${index < this.currentCharacter.blessinglevel ? '#333333' : '#aaaaaa'};"></td>
        <td class="auto-height-cell"><div class="auto-height-content" contenteditable="true" style="color: ${index < this.currentCharacter.blessinglevel ? '#333333' : '#aaaaaa'};">${row.corruption || ''}</div></td>
      `;
            tr.style.background = index < this.currentCharacter.blessinglevel ? 'none' : '#eeeeee';
            container.appendChild(tr);
        });

        container.addEventListener('input', (e) => {
            this.currentCharacter.blessingSystem = this.collectBlessingData();
        });
    }

    // 收集赐福表格数据
    collectBlessingData() {
        const container = document.getElementById('blessing-container');
        const rows = container.querySelectorAll('tr');
        const data = [];

        rows.forEach(row => {
            // 获取所有输入元素（input和contenteditable div）
            const levelInput = row.querySelector('input[type="number"]:first-of-type');
            const attributeContent = row.querySelector('td:nth-child(2) .auto-height-content');
            const bonusInput = row.querySelector('td:nth-child(3) input');
            const skillContent = row.querySelector('td:nth-child(4) .auto-height-content');
            const soulWearInput = row.querySelector('td:nth-child(5) input');
            const corruptionInput = row.querySelector('td:nth-child(6) .auto-height-content');

            data.push({
                level: parseInt(levelInput?.value || 1),
                attribute: attributeContent?.innerText.trim() || '', // 使用innerText获取div内容
                bonus: bonusInput?.value || 0,
                skill: skillContent?.innerText.trim() || '', // 使用innerText获取div内容
                soulWear: parseInt(soulWearInput?.value || 0),
                corruption: corruptionInput?.value || ''
            });
        });

        return data;
    }

    renderBlessingSkills(skillsData) {
        const container = document.getElementById('blessing-skills-container');
        container.innerHTML = '';

        // 确保总有5行数据
        const data = skillsData || Array(5).fill().map(() => ({
            name: '',
            description: ''
        }));

        data.forEach((skill, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td><input type="text" 
                   class="blessing-skill-name" 
                   value="${skill.name || ''}" ></td>
        <td class="auto-height-cell"><div class="auto-height-content blessing-skill-desc" contenteditable="true">${skill.description || ''}</div></td>
      `;
            container.appendChild(tr);
        });
    }

    collectTableData(containerId, fields) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`容器元素未找到: #${containerId}`);
            return [];
        }

        const rows = container.querySelectorAll('tbody > tr');
        const data = [];

        rows.forEach(row => {
            const inputs = row.querySelectorAll('input, .auto-height-content');
            if (inputs.length !== fields.length) {
                console.warn(`行输入数量不匹配: 期望 ${fields.length}，得到 ${inputs.length}`);
                return;
            }

            const item = {};
            fields.forEach((field, index) => {
                const value = inputs[index].value;
                // 根据字段类型转换值
                item[field] = this.convertFieldValue(field, value);
            });
            data.push(item);
        });

        return data;
    }

    // 权柄特技描述数据收集方法
    collectBlessingSkills() {
        const container = document.getElementById('blessing-skills-container');
        const rows = container.querySelectorAll('tr');
        const data = [];

        rows.forEach(row => {
            data.push({
                name: row.querySelector('.blessing-skill-name').value || '',
                description: row.querySelector('.blessing-skill-desc').value || ''
            });
        });

        return data;
    }

    convertFieldValue(field, value) {
        // 确定哪些字段应该是数字类型
        const numericFields = ['proficiency', 'uses', 'weight', 'quantity'];

        if (numericFields.includes(field)) {
            const num = parseFloat(value);
            return isNaN(num) ? 0 : num;
        }

        return value;
    }

    // 渲染状态标签
    renderStatusTags(statusArray) {
        const tagsContainer = document.getElementById('status-tags');
        tagsContainer.innerHTML = '';

        statusArray.forEach(status => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.textContent = status;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '×';
            deleteButton.className = 'tag-delete';
            deleteButton.onclick = () => this.removeStatusTag(status);

            tagElement.appendChild(deleteButton);
            tagsContainer.appendChild(tagElement);
        });
    }

    // 渲染技能列表
    renderSkills(skillsArray) {
        const skillsContainer = document.getElementById('skills-container');
        skillsContainer.innerHTML = '';

        skillsArray.forEach((skill, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
      <td><div class="auto-height-content" contenteditable="true">${skill.name || ''}</div></td>
      <td><input type="number" min="1" max="5" value="${skill.proficiency || 1}"></td>
      <td><input type="number" min="0" value="${skill.uses || 0}"></td>
      <td><div class="auto-height-content" contenteditable="true">${skill.description || ''}</div></td>
      <td><button class="btn btn-danger" data-index="${index}">删除</button></td>
    `;
            skillsContainer.appendChild(row);
        });
    }

    // 计算剩余熟练点数
    updateSkillProficiencyLeft() {
        // 获取智慧属性总值
        const intBase = parseInt(document.getElementById('attr-INT-base').value) || 0;
        const intStatus = parseInt(document.getElementById('attr-INT-status').value) || 0;
        const intBlessing = parseInt(document.getElementById('attr-INT-blessing').value) || 0;
        const intTotal = Math.min(20, Math.max(0, intBase + intStatus + intBlessing));

        // 计算最大可用熟练度
        const maxProficiency = intTotal * intTotal;

        // 计算已分配熟练度
        const skills = this.collectTableData('skills-container', ['name', 'proficiency', 'uses', 'description']);
        const usedProficiency = skills.reduce((sum, skill) => sum + (parseInt(skill.proficiency) || 0), 0);

        // 计算剩余并更新显示
        const remaining = maxProficiency - usedProficiency;
        const displayElement = document.getElementById('skill-prof-left');
        displayElement.textContent = remaining;

        // 根据剩余值设置颜色样式
        if (remaining < 0) {
            displayElement.style.color = '#e74c3c'; // 红色表示超限
        } else if (remaining < maxProficiency * 0.2) {
            displayElement.style.color = '#faad14'; // 黄色表示快用尽
        } else {
            displayElement.style.color = '#28a745'; // 绿色表示充足
        }
    }

    // 渲染装备列表
    renderEquipment(equipmentArray) {
        const equipmentContainer = document.getElementById('equipment-container');
        equipmentContainer.innerHTML = '';

        equipmentArray.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
      <td><div class="auto-height-content" contenteditable="true">${item.name || ''}</div></td>
      <td><div class="auto-height-content" contenteditable="true">${item.type || ''}</div></td>
      <td><div class="auto-height-content" contenteditable="true">${item.modifier || ''}</div></td>
      <td><div class="auto-height-content" contenteditable="true">${item.description || ''}</div></td>
      <td><button class="btn btn-danger" data-index="${index}">删除</button></td>
    `;
            equipmentContainer.appendChild(row);
        });
    }

    // 渲染背包物品
    renderInventory(inventoryArray) {
        const inventoryContainer = document.getElementById('inventory-container');
        inventoryContainer.innerHTML = '';

        inventoryArray.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
      <td><div class="auto-height-content" contenteditable="true">${item.name || ''}</div></td>
      <td><input type="number" min="0" step="0.5" value="${item.weight || 0}"></td>
      <td><div class="auto-height-content" contenteditable="true">${item.description || ''}</div></td>
      <td><input type="number" min="1" value="${item.quantity || 1}"></td>
      <td><button class="btn btn-danger" data-index="${index}">删除</button></td>
    `;
            inventoryContainer.appendChild(row);
        });
    }

    // 计算总负重
    updateTotalWeight() {
        const inventory = this.collectTableData('inventory-container', ['name', 'weight', 'description', 'quantity']);
        const totalWeight = inventory.reduce((sum, item) => sum + (parseFloat(item.weight) || 0) * (parseFloat(item.quantity) || 0), 0.0);

        const displayElement = document.getElementById('total-weight');
        displayElement.textContent = totalWeight;
    }

    // 删除状态标签
    removeStatusTag(status) {
        this.currentCharacter.status = this.currentCharacter.status.filter(s => s !== status);
        this.renderStatusTags(this.currentCharacter.status);
    }

    showToast(message, duration = 2000) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('toast-visible');

        setTimeout(() => {
            toast.classList.remove('toast-visible');
        }, duration);
    }

    // 辅助方法：从表格收集数据
    /* collectTableData(containerId, fields) {
        const container = document.getElementById(containerId);
        const rows = container.querySelectorAll('tr');
        const data = [];
    
        rows.forEach(row => {
            const inputs = row.querySelectorAll('input');
            const item = {};
    
            fields.forEach((field, index) => {
                const value = inputs[index].value;
                item[field] = field === 'proficiency' || field === 'uses' || field === 'weight' || field === 'quantity'
                    ? parseFloat(value)
                    : value;
            });
    
            data.push(item);
        });
    
        return data;
    }; */

    // 设置事件监听
    setupEventListeners() {

        // 图鉴按钮点击事件
        document.getElementById('show-roster').addEventListener('click', () => {
            this.toggleRosterPanel();
        });

        // 数据按钮点击事件
        document.getElementById('show-data').addEventListener('click', () => {
            this.toggleDataPanel();
        });

        // 数据管理面板中的按钮
        document.getElementById('export-character').addEventListener('click', async () => {
            if (this.currentCharacter) {
                await this.dataHandler.exportCharacter(this.currentCharacter.id);
            }
        });

        // 角色卡片操作
        document.getElementById('characters-list').addEventListener('click', async (e) => {
            const card = e.target.closest('.roster-item');
            if (!card) return;

            const id = parseInt(card.dataset.id);

            if (e.target.classList.contains('btn-load')) {
                const characters = await this.db.getAllCharacters();
                const character = characters.find(c => c.id === id);
                this.currentCharacter = character;
                this.renderCharacterDetail(this.currentCharacter);
            }
            else if (e.target.classList.contains('btn-export')) {
                await this.dataHandler.exportCharacter(id);
            }
            else if (e.target.classList.contains('btn-delete')) {
                if (confirm('确定删除这个角色吗？')) {
                    await this.db.deleteCharacter(id);
                    this.renderCharacterList();
                }
            }
        });

        // 保存角色
        document.getElementById('save-character').addEventListener('click', async () => {
            const saveBtn = document.getElementById('save-character');
            const originalText = saveBtn.textContent;

            try {
                saveBtn.textContent = '保存中...';
                saveBtn.disabled = true;
                // 收集基本信息
                const characterData = {
                    ...this.currentCharacter,
                    name: document.getElementById('character-name').value,
                    player: document.getElementById('player-name').value,
                    gender: document.getElementById('character-gender').value,
                    age: parseInt(document.getElementById('character-age').value),
                    alignment: document.getElementById('character-alignment').value,
                    nationality: document.getElementById('character-nationality').value,
                    class: document.getElementById('character-class').value,
                    blessing: document.getElementById('character-blessing').value,
                    description: document.getElementById('character-description').value,
                    blessinglevel: parseInt(document.getElementById('blessing-level').value),
                    blessingSystem: this.collectBlessingData(),
                    blessingSkills: this.collectBlessingSkills(),
                    soul: parseInt(document.getElementById('blessing-soul').value),
                    attributes: this.collectAttributes()
                };

                // 如果是现有角色，保留id
                if (this.currentCharacter && this.currentCharacter.id) {
                    characterData.id = this.currentCharacter.id;
                }

                // 创建/更新角色对象
                const character = new Character(characterData);

                // 收集动态数据（技能、装备、物品）
                character.skills = this.collectTableData('skills-container', ['name', 'proficiency', 'uses', 'description']);
                character.equipment = this.collectTableData('equipment-container', ['name', 'type', 'modifier', 'description']);
                character.inventory = this.collectTableData('inventory-container', ['name', 'weight', 'description', 'quantity']);

                // 保存到数据库
                const savedCharacter = await this.db.saveCharacter(character);

                // 更新当前角色引用
                this.currentCharacter = savedCharacter;
                this.renderCharacterDetail(this.currentCharacter);
                this.renderCharacterList();
                this.showToast('角色已保存！');
            } catch (error) {
                console.error('保存错误:', error);
                alert(`保存失败: ${error.message}`);
            } finally {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }
        });

        // 导入角色
        document.getElementById('import-character').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                if (!file.name.endsWith('.json') && !file.type.includes('json')) {
                    throw new Error('请导入JSON格式的角色文件');
                }

                await this.dataHandler.importCharacter(file);
                this.renderCharacterList();
                this.showToast('角色导入成功！');
            } catch (error) {
                alert(`导入失败: ${error.message}`);
            } finally {
                e.target.value = ''; // 重置input
            }
        });

        // 批量导出
        document.getElementById('export-all').addEventListener('click', async () => {
            await this.dataHandler.exportAllCharacters();
        });

        // 创建新角色
        document.getElementById('new-character').addEventListener('click', () => {
            this.currentCharacter = new Character();
            this.renderCharacterDetail(this.currentCharacter);
        });

        // 上传肖像
        document.getElementById('upload-portrait').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.match('image.*')) {
                alert('请选择有效的图片文件');
                return;
            }

            try {
                // 压缩图片
                const compressedImage = await this.compressImage(file);
                this.currentCharacter.portrait = compressedImage;
                this.renderPortrait();
            } catch (error) {
                console.error('图片处理失败:', error);
                alert('图片处理失败，请尝试其他图片');
            }
        });

        // 移除肖像
        document.getElementById('remove-portrait').addEventListener('click', () => {
            this.currentCharacter.portrait = null;
            this.renderPortrait();
        });

        // 添加状态标签
        document.getElementById('add-tag').addEventListener('click', () => {
            const newTagInput = document.getElementById('new-tag');
            const newTag = newTagInput.value.trim();

            if (newTag && !this.currentCharacter.status.includes(newTag)) {
                this.currentCharacter.status.push(newTag);
                this.renderStatusTags(this.currentCharacter.status);
                newTagInput.value = '';
            }
        });

        // 赐福等级变化
        document.getElementById('blessing-level').addEventListener('change', () => {
            this.currentCharacter.blessinglevel = parseInt(document.getElementById('blessing-level').value) || 1;
            this.renderBlessingSystem(this.currentCharacter.blessingSystem, this.currentCharacter.blessing);
        })

        // 添加技能
        document.getElementById('add-skill').addEventListener('click', () => {
            this.currentCharacter.skills.push({
                name: '',
                proficiency: 1,
                uses: 0,
                description: ''
            });
            this.renderSkills(this.currentCharacter.skills);
        });

        // 添加装备
        document.getElementById('add-equipment').addEventListener('click', () => {
            this.currentCharacter.equipment.push({
                name: '',
                type: '',
                modifier: '',
                description: ''
            });
            this.renderEquipment(this.currentCharacter.equipment);
        });

        // 添加物品
        document.getElementById('add-item').addEventListener('click', () => {
            this.currentCharacter.inventory.push({
                name: '',
                weight: 0,
                description: '',
                quantity: 1
            });
            this.renderInventory(this.currentCharacter.inventory);
        });

        // 删除技能/装备/物品的通用处理
        ['skills-container', 'equipment-container', 'inventory-container'].forEach(containerId => {
            document.getElementById(containerId).addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-danger')) {
                    const index = parseInt(e.target.dataset.index);
                    const property = containerId.split('-')[0]; // 'skills', 'equipment' 或 'inventory'

                    this.currentCharacter[property].splice(index, 1);
                    this[`render${property.charAt(0).toUpperCase() + property.slice(1)}`](this.currentCharacter[property]);
                }
            });
        });

        // 添加数据库删除确认
        document.getElementById('delete-db-btn').addEventListener('click', async () => {
            const confirmed = confirm(
                "⚠️ 危险操作！\n\n这将永久删除所有角色数据，包括：\n" +
                "- 所有角色信息\n- 角色图片\n- 装备和技能数据\n\n" +
                "确定要继续吗？"
            );

            if (confirmed) {
                try {
                    await this.db.deleteEntireDB();
                    alert("数据库已成功删除，页面将刷新以重新初始化");
                    location.reload(); // 刷新页面
                } catch (error) {
                    alert(`删除失败: ${error.message}`);
                }
            }
        });

        // 技能表格变化时更新剩余熟练度
        document.getElementById('skills-container').addEventListener('input', (e) => {
            if (e.target.classList.contains('auto-height-content') ||
                e.target.type === 'number') {
                this.updateSkillProficiencyLeft();
            }
        });

        // 添加/删除技能时更新
        document.getElementById('add-skill').addEventListener('click', () => {
            setTimeout(() => this.updateSkillProficiencyLeft(), 0);
        });
        document.getElementById('skills-container').addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-danger')) {
                setTimeout(() => this.updateSkillProficiencyLeft(), 0);
            }
        });

        // 背包表格变化时更新总重
        document.getElementById('inventory-container').addEventListener('input', (e) => {
            if (e.target.type === 'number') {
                this.updateTotalWeight();
            }
        })
        document.getElementById('add-item').addEventListener('click', () => {
            setTimeout(() => this.updateTotalWeight(), 0);
        });
        document.getElementById('inventory-container').addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-danger')) {
                setTimeout(() => this.updateTotalWeight(), 0);
            }
        });

        // 初始计算
        this.updateMaxValues();
    }
}

// 启动应用
window.onload = () => {
    new GOGCharacterApp();
};
