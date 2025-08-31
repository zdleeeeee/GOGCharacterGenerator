// app.js - 主应用逻辑
class GOGCharacterApp {
    static MAX_ATTRIBUTE_BASE = 20;
    static MAX_HP_MP_BASE = 20;
    static MAX_ATTRIBUTE_VALUE = 20;

    constructor() {
        this.db = new CharacterDB();
        this.dataHandler = new DataHandler(this.db);
        this.currentCharacter = null;
        this.init();
    }

    async init() {
        await this.db.openDB();
        this.renderCharacterList();


        this.currentCharacter = new Character();
        this.renderCharacterDetail(this.currentCharacter);
        this.renderBlessingsList();
        this.renderSkillsList();
        this.renderEquipmentsList();
        this.renderInventoryList();
        this.renderClassesList();
        this.setupEventListeners();
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
        const mainContainer = document.getElementById('main-container');
        panel.style.display = 'block';
        mainContainer.style.paddingBottom = '480px';
        this.renderCharacterList();
    }
    closeRosterPanel() {
        document.getElementById('roster-panel').style.display = 'none';
        const mainContainer = document.getElementById('main-container');
        mainContainer.style.paddingBottom = '40px';
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

    // 渲染图鉴
    async renderCharacterList() {
        const characters = await this.db.getAllCharacters();
        const listContainer = document.getElementById('characters-list');

        listContainer.innerHTML = characters.map(char => `
      <div class="roster-item" data-id="${char.id}">
        <div class="roster-avatar" style="background-image: url('${char.portrait || 'default-avatar.jpg'}')"></div>
        <div class="roster-info">
          <h5>${char.name}<span style="font-size: 12px; color: #666666; font-weight: normal;">(pl. ${char.player})</span></h5>
          <div style="display: grid;grid-template-columns: 1fr 1fr; margin-top:5px;">
            <span>${char.class}</span>
            <span>${char.blessing}Lv.${char.blessinglevel}</span>
          </div>
          <div style="display: grid;grid-template-columns: 1fr 1fr 1fr; margin-top:0px;">
            <span>HP: <strong>${char.attributes.HP.current}</strong> /${char.attributes.HP.base + 2 * (char.isGod === '神明' ?
                Math.max(0, char.attributes.STR.base + char.attributes.STR.statusAdj + char.attributes.STR.blessingAdj) :
                Math.min(GOGCharacterApp.MAX_ATTRIBUTE_VALUE, Math.max(0, char.attributes.STR.base + char.attributes.STR.statusAdj + char.attributes.STR.blessingAdj)))
            }</span>
            <span>MP: <strong>${char.attributes.MP.current}</strong> /${char.attributes.MP.base + (char.isGod === '神明' ?
                Math.max(0, char.attributes.MAG.base + char.attributes.MAG.statusAdj + char.attributes.MAG.blessingAdj) :
                Math.min(GOGCharacterApp.MAX_ATTRIBUTE_VALUE, Math.max(0, char.attributes.MAG.base + char.attributes.MAG.statusAdj + char.attributes.MAG.blessingAdj)))}</span>
            <span>BXP: <strong>${char.soul}</strong>%</span>
          </div>
        </div>
        <div class="character-actions">
          <button class="btn-load" style="border-radius: 8px 0px 0px 8px ;">加载</button>
          <button class="btn-export" style="border-radius: 0px;">导出</button>
          <button class="btn-delete" style="border-radius: 0px 8px 8px 0px ;">删除</button>
        </div>
      </div>
    `).join('');
    }
    renderBlessingsList() {
        const container = document.getElementById('blessings-list');
        container.innerHTML = '';

        // 添加搜索框和筛选器
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
        <div class="search-controls" style="grid-template-columns: 88% 10%;">
            <input type="text" id="blessing-search-input" placeholder="搜索赐福名称或描述">
            <button id="clear-blessing-search" class="btn-clear-search">重置</button>
        </div>
    `;
        container.appendChild(searchContainer);

        const blessingsListContainer = document.createElement('div');
        blessingsListContainer.id = 'blessings-list-content';
        container.appendChild(blessingsListContainer);

        this.filterAndRenderBlessings();

        // 添加事件监听
        document.getElementById('blessing-search-input').addEventListener('input', () => {
            this.filterAndRenderBlessings();
        });

        document.getElementById('clear-blessing-search').addEventListener('click', () => {
            document.getElementById('blessing-search-input').value = '';
            this.filterAndRenderBlessings();
        });
    }

    filterAndRenderBlessings() {
        const searchTerm = document.getElementById('blessing-search-input').value.toLowerCase();
        const container = document.getElementById('blessings-list-content');
        container.innerHTML = '';

        const filteredBlessings = window.staticData.blessings.filter(blessing => {
            if (!searchTerm) return true;

            // 检查名称和描述
            const nameMatch = blessing.fullName && blessing.fullName.toLowerCase().includes(searchTerm);

            // 检查系统描述
            const systemMatch = blessing.system && blessing.system.some(level =>
                (level.attribute && level.attribute.toLowerCase().includes(searchTerm))
            );

            // 检查技能描述
            const skillsMatch = blessing.skills && blessing.skills.some(skill =>
                (skill.name && skill.name.toLowerCase().includes(searchTerm)) ||
                (skill.description && skill.description.toLowerCase().includes(searchTerm))
            );

            return nameMatch || systemMatch || skillsMatch;
        });

        container.innerHTML = filteredBlessings.map(blessing => `
      <div class="blessing-item" data-name="${blessing.name}">
        <div class="blessing-header">
            <h5>${blessing.fullName}</h5>
            <div class="header-actions">
            <button class="btn-apply-blessing">应用</button>
            <span class="toggle-icon">+</span>
            </div>
        </div>
        <div class="blessing-details" style="display:none">
        <div class="blessing-system">
            ${blessing.system.map(level => `
                <p><strong>Lv.${level.level}:</strong> ${level.attribute} - ${level.skill} - ${level.corruption}</p>
                `).join('')}
            </div>
                <div class="blessing-skills">
                    <h5>权柄技能</h5>
                    ${blessing.skills.map(skill => `
                        <p><strong>${skill.name}:</strong> ${skill.description}</p>
                    `).join('')}
                </div>
            </div>
      </div>
    `).join('');
        // 点击标题切换折叠状态
        container.querySelectorAll('.blessing-header').forEach(header => {
            header.addEventListener('click', (e) => {
                // 防止点击应用按钮时触发折叠
                if (e.target.closest('.btn-apply-blessing')) return;

                const item = header.closest('.blessing-item');
                const details = item.querySelector('.blessing-details');
                const toggleIcon = header.querySelector('.toggle-icon');

                const isHidden = details.style.display === 'none';
                details.style.display = isHidden ? 'block' : 'none';
                toggleIcon.textContent = isHidden ? '-' : '+';
            });
        });

        if (filteredBlessings.length === 0) {
            container.innerHTML = '<div class="no-results">没有找到匹配的赐福</div>';
        }
    }

    renderSkillsList() {
        const container = document.getElementById('skills-list');
        container.innerHTML = '';

        // 添加搜索框和筛选器
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
        <div class="search-controls">
            <input type="text" id="skill-search-input" placeholder="搜索技能名称、类别或描述">
            <div class="select-container">
                <div class="custom-select select-style-2" tabindex="0" id="skill-class-filter-c">
                    <select id="skill-class-filter">
                        <option value="" selected>所有类别</option>
                        <option value="基础">基础</option>
                        <option value="西方学院派魔法">西方学院派魔法</option>
                        <option value="怀武炁术法">怀武炁术法</option>
                    </select>
                    <div class="select-selected">所有类别</div>
                    <div class="select-items">
                        <div class="select-item" data-value="">所有类别</div>
                        <div class="select-item" data-value="基础">基础</div>
                        <div class="select-item" data-value="西方学院派魔法">西方学院派魔法</div>
                        <div class="select-item" data-value="怀武炁术法">怀武炁术法</div>
                    </div>
                </div>
            </div>
            <button id="clear-skill-search" class="btn-clear-search">重置</button>
        </div>
    `;
        container.appendChild(searchContainer);

        // 创建技能列表容器
        const skillsListContainer = document.createElement('div');
        skillsListContainer.id = 'skills-list-content';
        container.appendChild(skillsListContainer);

        // 初始渲染
        this.filterAndRenderSkills();

        // 添加事件监听
        document.getElementById('skill-search-input').addEventListener('input', () => {
            this.filterAndRenderSkills();
        });

        document.getElementById('skill-class-filter').addEventListener('change', () => {
            this.filterAndRenderSkills();
        });

        document.getElementById('clear-skill-search').addEventListener('click', () => {
            document.getElementById('skill-search-input').value = '';
            document.getElementById('skill-class-filter').value = '';
            const select = document.getElementById('skill-class-filter-c');
            const selected = select.querySelector('.select-selected');
            const items = select.querySelector('.select-items');
            const options = items.querySelectorAll('.select-item');

            const initialValue = '';
            const initialOption = Array.from(options).find(opt => (opt.getAttribute('data-value') === initialValue) || (!initialValue && !opt.getAttribute('data-value')));
            if (initialOption) {
                selected.textContent = initialOption.textContent;
                options.forEach(opt => opt.classList.remove('select-same-as-selected'));
                initialOption.classList.add('select-same-as-selected');
            }
            this.filterAndRenderSkills();
        });
    }
    filterAndRenderSkills() {
        const searchTerm = document.getElementById('skill-search-input').value.toLowerCase();
        const selectedClass = document.getElementById('skill-class-filter').value;

        const container = document.getElementById('skills-list-content');
        container.innerHTML = '';

        // 获取所有技能并应用筛选
        const allSkills = Object.entries(window.staticData.skills).flatMap(([category, skills]) =>
            skills.map(skill => ({ ...skill, category }))
        );

        const filteredSkills = allSkills.filter(skill => {
            // 按职业筛选
            if (selectedClass && skill.class !== selectedClass) return false;

            // 通用搜索
            if (!searchTerm) return true;

            return (
                skill.name.toLowerCase().includes(searchTerm) ||
                skill.class.toLowerCase().includes(searchTerm) ||
                skill.description.toLowerCase().includes(searchTerm)
            );
        });

        // 按类别分组
        const skillsByCategory = filteredSkills.reduce((acc, skill) => {
            if (!acc[skill.category]) acc[skill.category] = [];
            acc[skill.category].push(skill);
            return acc;
        }, {});

        Object.entries(skillsByCategory).forEach(([category, skills]) => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'skill-category';

            // 创建分类标题（可点击折叠）
            const header = document.createElement('div');
            header.className = 'skill-category-header';
            header.innerHTML = `
        <div class="item-header">
            <h5>${category}</h5>
            <span class="toggle-icon">-</span>
        </div>
      `;

            // 创建技能列表容器
            const listContainer = document.createElement('div');
            listContainer.className = 'skill-items-container';
            listContainer.style.display = 'block';

            // 填充技能项
            listContainer.innerHTML = skills.map(skill => `
        <div class="skill-item">
        <div class="item-header">
          <div style="padding-left: 5px;margin: 0px;font-size: 14px;">
          <span class="skill-name" style="font-weight: bold;">${skill.name}</span>
          <span class="skill-class">(${skill.class})</span>
          </div>
          <button class="btn-add-skill" 
                  data-name="${skill.name}"
                  data-class="${skill.class}"
                  data-description="${skill.description}">
            添加
          </button>
        </div>
          <div class="skill-description">${skill.description}</div>
        </div>
      `).join('');

            // 点击标题切换折叠状态
            header.addEventListener('click', () => {
                const isHidden = listContainer.style.display === 'none';
                listContainer.style.display = isHidden ? 'block' : 'none';
                header.querySelector('.toggle-icon').textContent = isHidden ? '-' : '+';
            });

            categoryElement.appendChild(header);
            categoryElement.appendChild(listContainer);
            container.appendChild(categoryElement);
        });

        if (filteredSkills.length === 0) {
            container.innerHTML = '<div class="no-results">没有找到匹配的技能</div>';
        }
    }

    renderClassesList() {
        const container = document.getElementById('classes-list');
        container.innerHTML = '';

        // 添加搜索框和筛选器
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
        <div class="search-controls">
            <input type="text" id="class-search-input" placeholder="搜索职业名称或描述">
            <div class="select-container">
                <div class="custom-select select-style-2" tabindex="0" id="class-type-filter-c">
                <select id="class-type-filter">
                    <option value="" selected>所有职业</option>
                    <option value="前线">前线（近战/防御）</option>
                    <option value="远程">远程（物理/魔法）</option>
                    <option value="支援">支援（控场/治疗）</option>
                    <option value="社交">社交（谈判/情报）</option>
                    <option value="工农">工农（生产/贸易）</option>
                    <option value="学者">学者（解密/研究）</option>
                    <option value="浪人">浪人（侦查/生存）</option>
                </select>
                <div class="select-selected">所有职业</div>
                    <div class="select-items">
                        <div class="select-item" data-value="">所有职业</div>
                        <div class="select-item" data-value="前线">前线<br>-近战/防御</div>
                        <div class="select-item" data-value="远程">远程<br>-物理/魔法</div>
                        <div class="select-item" data-value="支援">支援<br>-控场/治疗</div>
                        <div class="select-item" data-value="社交">社交<br>-谈判/情报</div>
                        <div class="select-item" data-value="工农">工农<br>-生产/贸易</div>
                        <div class="select-item" data-value="学者">学者<br>-解密/研究</div>
                        <div class="select-item" data-value="浪人">浪人<br>-侦查/生存</div>
                    </div>
                </div>
            </div>
            <button id="clear-class-search" class="btn-clear-search">重置</button>
        </div>
    `;
        container.appendChild(searchContainer);

        // 创建技能列表容器
        const classesListContainer = document.createElement('div');
        classesListContainer.id = 'classes-list-content';
        container.appendChild(classesListContainer);

        // 初始渲染
        this.filterAndRenderClasses();

        // 添加事件监听
        document.getElementById('class-search-input').addEventListener('input', () => {
            this.filterAndRenderClasses();
        });

        document.getElementById('class-type-filter').addEventListener('change', () => {
            this.filterAndRenderClasses();
        });

        document.getElementById('clear-class-search').addEventListener('click', () => {
            document.getElementById('class-search-input').value = '';
            document.getElementById('class-type-filter').value = '';
            const select = document.getElementById('class-type-filter-c');
            const selected = select.querySelector('.select-selected');
            const items = select.querySelector('.select-items');
            const options = items.querySelectorAll('.select-item');

            const initialValue = '';
            const initialOption = Array.from(options).find(opt => (opt.getAttribute('data-value') === initialValue) || (!initialValue && !opt.getAttribute('data-value')));
            if (initialOption) {
                selected.textContent = initialOption.textContent;
                options.forEach(opt => opt.classList.remove('select-same-as-selected'));
                initialOption.classList.add('select-same-as-selected');
            }
            this.filterAndRenderClasses();
        });
    }
    filterAndRenderClasses() {
        const searchTerm = document.getElementById('class-search-input').value.toLowerCase();
        const selectedType = document.getElementById('class-type-filter').value;

        const container = document.getElementById('classes-list-content');
        container.innerHTML = '';

        // 获取所有职业并应用筛选
        const allClasses = Object.entries(window.staticData.classes).flatMap(([category, classes]) =>
            classes.map(cl => ({ ...cl, category }))
        );

        const filteredClasses = allClasses.filter(cl => {
            // 按职业类别筛选
            if (selectedType && !cl.type.toLowerCase().includes(selectedType)) return false;

            // 通用搜索
            if (!searchTerm) return true;

            const skillsMatch = cl.skills && cl.skills.some(skill =>
                (skill.name && skill.name.toLowerCase().includes(searchTerm)) ||
                (skill.description && skill.description.toLowerCase().includes(searchTerm))
            );

            return (
                cl.name.toLowerCase().includes(searchTerm) ||
                cl.bkgd.toLowerCase().includes(searchTerm) ||
                cl.type.toLowerCase().includes(searchTerm) ||
                skillsMatch
            );
        });

        // 按类别分组
        const classesByCategory = filteredClasses.reduce((acc, cl) => {
            if (!acc[cl.category]) acc[cl.category] = [];
            acc[cl.category].push(cl);
            return acc;
        }, {});

        Object.entries(classesByCategory).forEach(([category, classes]) => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'class-category';

            // 创建分类标题（可点击折叠）
            const header = document.createElement('div');
            header.className = 'class-category-header';
            header.innerHTML = `
        <div class="item-header">
            <h5>${category}</h5>
            <span class="toggle-icon">-</span>
        </div>
      `;

            // 创建职业列表容器
            const listContainer = document.createElement('div');
            listContainer.className = 'class-items-container';
            listContainer.style.display = 'block';

            listContainer.innerHTML = classes.map(cl => `
        <div class="class-item">
        <div class="item-header">
          <div style="padding: 5px;margin: 0px;font-size: 14px;">
          <span class="class-name" style="font-weight: bold;">${cl.name}</span>
          <span class="class-type">(${cl.type})</span>
          </div>
          <button class="btn-apply-class" 
                  data-name="${cl.name}"
                  data-category="${category}">
            应用
          </button>
        </div>
          <div class="class-bkgd">${cl.bkgd}</div>
          <div class="class-skills">
            <h5>职业技能</h5>
            ${cl.skills.map(skill => `
                <p><strong>${skill.name}:</strong> ${skill.description}</p>
           `).join('')}
          </div>
        </div>
      `).join('');

            // 点击标题切换折叠状态
            header.addEventListener('click', () => {
                const isHidden = listContainer.style.display === 'none';
                listContainer.style.display = isHidden ? 'block' : 'none';
                header.querySelector('.toggle-icon').textContent = isHidden ? '-' : '+';
            });

            categoryElement.appendChild(header);
            categoryElement.appendChild(listContainer);
            container.appendChild(categoryElement);
        });

        if (filteredClasses.length === 0) {
            container.innerHTML = '<div class="no-results">没有找到匹配的职业</div>';
        }
    }

    renderEquipmentsList() {
        const container = document.getElementById('equipments-list');
        container.innerHTML = '';

        // 添加搜索框和筛选器
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
        <div class="search-controls" style="grid-template-columns: 88% 10%;">
            <input type="text" id="equipment-search-input" placeholder="搜索装备名称、类型或描述">
            <button id="clear-equipment-search" class="btn-clear-search">重置</button>
        </div>
    `;
        container.appendChild(searchContainer);

        const equipmentsListContainer = document.createElement('div');
        equipmentsListContainer.id = 'equipments-list-content';
        container.appendChild(equipmentsListContainer);

        this.filterAndRenderEquipments();

        // 添加事件监听
        document.getElementById('equipment-search-input').addEventListener('input', () => {
            this.filterAndRenderEquipments();
        });

        document.getElementById('clear-equipment-search').addEventListener('click', () => {
            document.getElementById('equipment-search-input').value = '';
            this.filterAndRenderEquipments();
        });
    }

    filterAndRenderEquipments() {
        const searchTerm = document.getElementById('equipment-search-input').value.toLowerCase();
        const container = document.getElementById('equipments-list-content');
        container.innerHTML = '';

        const allEquipments = Object.entries(window.staticData.equipments).flatMap(([category, equipments]) =>
            equipments.map(equipment => ({ ...equipment, category }))
        );

        const filteredEquipments = allEquipments.filter(equipment => {
            if (!searchTerm) return true;

            return (
                equipment.name.toLowerCase().includes(searchTerm) ||
                equipment.type.toLowerCase().includes(searchTerm) ||
                equipment.modifier.toLowerCase().includes(searchTerm) ||
                equipment.description.toLowerCase().includes(searchTerm)
            );
        });

        // 按类别分组
        const equipmentsByCategory = filteredEquipments.reduce((acc, equipment) => {
            if (!acc[equipment.category]) acc[equipment.category] = [];
            acc[equipment.category].push(equipment);
            return acc;
        }, {});

        Object.entries(equipmentsByCategory).forEach(([category, equipments]) => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'equipment-category';

            const header = document.createElement('div');
            header.className = 'equipment-category-header';
            header.innerHTML = `
        <div class="item-header">
            <h5>${category}</h5>
            <span class="toggle-icon">-</span>
        </div>
      `;

            const listContainer = document.createElement('div');
            listContainer.className = 'equipment-items-container';
            listContainer.style.display = 'block';

            listContainer.innerHTML = equipments.map(equipment => `
        <div class="equipment-item">
        <div class="item-header">
          <div style="padding-left: 5px;margin: 0px;font-size: 14px;">
          <span class="equipment-name" style="font-weight: bold;">${equipment.name}</span>
          <span class="equipment-type">(${equipment.type})</span>
          </div>
          <button class="btn-add-equipment" 
                  data-name="${equipment.name}"
                  data-type="${equipment.type}"
                  data-modifier="${equipment.modifier}"
                  data-description="${equipment.description}">
            添加
          </button>
        </div>
          <div class="equipment-description">属性影响：${equipment.modifier}</div>
          <div class="equipment-description">${equipment.description}</div>
        </div>
      `).join('');

            header.addEventListener('click', () => {
                const isHidden = listContainer.style.display === 'none';
                listContainer.style.display = isHidden ? 'block' : 'none';
                header.querySelector('.toggle-icon').textContent = isHidden ? '-' : '+';
            });

            categoryElement.appendChild(header);
            categoryElement.appendChild(listContainer);
            container.appendChild(categoryElement);
        });

        if (filteredEquipments.length === 0) {
            container.innerHTML = '<div class="no-results">没有找到匹配的装备</div>';
        }
    }

    renderInventoryList() {
        const container = document.getElementById('inventory-list');
        container.innerHTML = '';

        // 添加搜索框和筛选器
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
        <div class="search-controls" style="grid-template-columns: 88% 10%;">
            <input type="text" id="inventory-search-input" placeholder="搜索物品名称或描述">
            <button id="clear-inventory-search" class="btn-clear-search">重置</button>
        </div>
    `;
        container.appendChild(searchContainer);

        const inventoryListContainer = document.createElement('div');
        inventoryListContainer.id = 'inventory-list-content';
        container.appendChild(inventoryListContainer);

        this.filterAndRenderInventory();

        // 添加事件监听
        document.getElementById('inventory-search-input').addEventListener('input', () => {
            this.filterAndRenderInventory();
        });

        document.getElementById('clear-inventory-search').addEventListener('click', () => {
            document.getElementById('inventory-search-input').value = '';
            this.filterAndRenderInventory();
        });
    }

    filterAndRenderInventory() {
        const searchTerm = document.getElementById('inventory-search-input').value.toLowerCase();
        const container = document.getElementById('inventory-list-content');
        container.innerHTML = '';

        const allInventory = Object.entries(window.staticData.inventory).flatMap(([category, inventory]) =>
            inventory.map(Inventory => ({ ...Inventory, category }))
        );

        const filteredInventory = allInventory.filter(inventory => {
            if (!searchTerm) return true;

            return (
                inventory.name.toLowerCase().includes(searchTerm) ||
                inventory.weight.toLowerCase().includes(searchTerm) ||
                inventory.description.toLowerCase().includes(searchTerm)
            );
        });

        // 按类别分组
        const inventoryByCategory = filteredInventory.reduce((acc, inventory) => {
            if (!acc[inventory.category]) acc[inventory.category] = [];
            acc[inventory.category].push(inventory);
            return acc;
        }, {});

        Object.entries(inventoryByCategory).forEach(([category, inventory]) => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'inventory-category';

            const header = document.createElement('div');
            header.className = 'inventory-category-header';
            header.innerHTML = `
        <div class="item-header">
            <h5>${category}</h5>
            <span class="toggle-icon">-</span>
        </div>
      `;

            const listContainer = document.createElement('div');
            listContainer.className = 'inventory-items-container';
            listContainer.style.display = 'block';
            category = this.mapItemCategoryNameToKey(category);
            listContainer.innerHTML = inventory.map(Inventory => `
        <div class="inventory-item">
        <div class="item-header">
          <div style="padding-left: 5px;margin: 0px;font-size: 14px;">
          <span class="inventory-name" style="font-weight: bold;">${Inventory.name}</span>
          <span class="inventory-weight">(${Inventory.weight} kg)</span>
          </div>
          <button class="btn-add-inventory" 
                  data-name="${Inventory.name}"
                  data-weight="${Inventory.weight}"
                  data-description="${Inventory.description}"
                  data-category="${category}">
            添加
          </button>
        </div>
          <div class="inventory-description">${Inventory.description}</div>
        </div>
      `).join('');

            header.addEventListener('click', () => {
                const isHidden = listContainer.style.display === 'none';
                listContainer.style.display = isHidden ? 'block' : 'none';
                header.querySelector('.toggle-icon').textContent = isHidden ? '-' : '+';
            });

            categoryElement.appendChild(header);
            categoryElement.appendChild(listContainer);
            container.appendChild(categoryElement);
        });

        if (filteredInventory.length === 0) {
            container.innerHTML = '<div class="no-results">没有找到匹配的物品</div>';
        }
    }
    applyBlessing(blessingName) {
        const blessing = window.staticData.blessings.find(b => b.name === blessingName);
        if (!blessing) return;

        // 更新当前角色
        this.currentCharacter.blessing = blessing.name;
        this.currentCharacter.blessingFullName = blessing.fullName;
        this.currentCharacter.blessingSystem = blessing.system;
        const skillsWithUnlearnedTag = blessing.skills.map(skill => {
            return {
                ...skill,
                description: `【未学习】${skill.description}`
            };
        });
        this.currentCharacter.blessingSkills = skillsWithUnlearnedTag;

        // 更新UI
        document.getElementById('character-blessing').value = blessing.name;
        document.getElementById('blessingFullName').value = blessing.fullName;
        this.renderBlessingSystem(blessing.system, blessing.name);
        this.renderBlessingSkills(skillsWithUnlearnedTag);
        this.showToast(`权柄 【${blessing.name}】 已应用`);
    }
    addSkillToCharacter(skillData) {
        const categories = [];
        const catemess = [];

        // 从description中解析属性
        const desc = skillData.description;
        // 查找属性部分（从开头到第一个";"之前）
        const attrEndIndex = desc.indexOf('；');
        if (attrEndIndex !== -1) {
            const attrPart = desc.substring(0, attrEndIndex);
            // 分割属性（由/隔开）
            const attributes = attrPart.split('/');

            attributes.forEach(attr => {
                const trimmedAttr = attr.trim();
                if (trimmedAttr) {
                    const category = this.mapCategoryNameToKey(trimmedAttr);
                    categories.push(category);
                    catemess.push(trimmedAttr);
                }
            });
        }

        if (categories.length === 0) {
            categories.push('INT');
            catemess.push(`智慧`);
        }

        let toastmessage = `技能${skillData.name}已添加到类别` + catemess.join('、') + `中`;

        categories.forEach(category => {
            if (!this.currentCharacter.skills[category]) {
                this.currentCharacter.skills[category] = [];
            }

            this.currentCharacter.skills[category].push({
                name: skillData.name,
                proficiency: 0,
                description: skillData.description,
                uses: 0
            });

        })

        this.renderSkills(this.currentCharacter.skills);
        // this.updateSkillProficiencyLeft();
        this.showToast(toastmessage);
    }

    // 辅助方法：将中文类别名映射为属性键名
    mapCategoryNameToKey(categoryName) {
        return Character.categoryMappings[categoryName] || 'INT'; // 默认返回'智慧'
    }
    mapItemCategoryNameToKey(categoryName) {
        return Character.categoryMappings[categoryName] || 'supplies'; // 默认返回'储备/其他物品'
    }
    // 辅助方法：将属性键名转换为中文类别名
    getCategoryName(categoryKey) {
        return Character.categoryMappings[categoryKey] || categoryKey; // 默认返回原key
    }

    addEquipmentToCharacter(equipment) {
        this.currentCharacter.equipment = this.currentCharacter.equipment || [];
        this.currentCharacter.equipment.push({
            name: equipment.name,
            type: equipment.type,
            modifier: equipment.modifier,
            description: equipment.description,
        });

        this.renderEquipment(this.currentCharacter.equipment);
        this.showToast(`装备${equipment.name}已添加`);
    }
    addInventoryToCharacter(item) {
        this.currentCharacter.inventory[item.category] = this.currentCharacter.inventory[item.category] || [];
        this.currentCharacter.inventory[item.category].push({
            name: item.name,
            weight: item.weight,
            description: item.description,
            quantity: 1,
        });

        this.renderInventory(this.currentCharacter.inventory);
        this.updateTotalWeight();
        const category = this.mapItemCategoryNameToKey(item.category);
        this.showToast(`物品${item.name}(${category})已放入背包`);
    }
    applyClass(clnm, clcat) {
        const cl = window.staticData.classes[clcat].find(c => c.name === clnm);
        if (!cl) return;
        this.currentCharacter.class = cl.name;
        if (!this.currentCharacter.skills.PRF) {
            this.currentCharacter.skills.PRF = [];
        }
        this.currentCharacter.skills.PRF.push({
            name: "职业背景",
            proficiency: 0,
            description: `${cl.name}（${cl.type}）：${cl.bkgd}`,
            uses: 0
        })
        cl.skills.forEach(skill => {
            this.currentCharacter.skills.PRF.push({
                name: skill.name,
                proficiency: 0,
                description: skill.description,
                uses: 0
            });
        })

        document.getElementById('character-class').value = cl.name;
        this.renderSkills(this.currentCharacter.skills);
        this.showToast(`职业 【${cl.name}】 已应用`);
    }

    // 通用输入绑定方法
    bindInputToCharacter(inputId, property) {
        const input = document.getElementById(inputId);
        if (!input) return;

        input.value = this.currentCharacter[property] || '';
        input.addEventListener('input', () => {
            this.currentCharacter[property] = input.type === 'number' ? parseInt(input.value) || 0 : input.value;
            // 如果是灵魂完整度，更新状态标签
            if (inputId === 'blessing-soul') {
                this.updateSoulStatus();
            }
        });

        // 如果是灵魂完整度，初始化状态标签
        if (inputId === 'blessing-soul') {
            this.updateSoulStatus();
            document.getElementById('blessing-soul').value = this.currentCharacter.soul || 0;
        }
        if (inputId === 'blessing-level') {
            document.getElementById('blessing-level').value = this.currentCharacter.blessinglevel || 0;
        }
    }
    updateSoulStatus() {
        const soulValue = this.currentCharacter.soul || 0;
        const statusElement = document.getElementById('soul-status');
        let bkcolor = '#666666';
        let bkcolor1 = '#888888';

        // 根据灵魂完整度范围设置不同状态
        if (soulValue > 90) {
            statusElement.textContent = '神明代行者';
            bkcolor = '#6d35ddff'; // 中紫色 - 半神领域
            bkcolor1 = '#8d56faff';
        } else if (soulValue > 80) {
            statusElement.textContent = '圣徒';
            bkcolor = '#ca2cabff'; // 玫红色 - 神圣高阶
            bkcolor1 = '#ff3bd8ff';
        } else if (soulValue > 60) {
            statusElement.textContent = '蒙恩者';
            bkcolor = '#4169E1'; // 皇家蓝 - 神明恩宠
            bkcolor1 = '#517cfbff';
        } else if (soulValue > 40) {
            statusElement.textContent = '受膏者';
            bkcolor = '#3ad2e0ff'; // 天青蓝 - 正式祝福
            bkcolor1 = 'rgba(140, 227, 220, 1)';
        } else if (soulValue > 20) {
            statusElement.textContent = '逐圣者';
            bkcolor = '#3CB371'; // 海洋绿 - 追寻圣道
            bkcolor1 = '#54de92ff';
        } else if (soulValue >= 1) {
            statusElement.textContent = '慕道者';
            bkcolor = '#e69c5bff'; // 沙褐色 - 初窥门径
            bkcolor1 = '#f6b175ff';
        } else if (soulValue === 0) {
            statusElement.textContent = '世俗之人';
            bkcolor = '#666666'; // 暗灰色 - 世俗之人
            bkcolor1 = '#333333';
        }

        statusElement.style.background = `radial-gradient(circle 0px at center center, ${bkcolor1}, ${bkcolor})`;
        statusElement.style.height = '22px';
        statusElement.style.textShadow = 'none';
        statusElement.style.letterSpacing = '6px';
        statusElement.style.fontSize = '14px';
        statusElement.style.padding = '4px';
        statusElement.style.transition = 'all 0.3s ease-out';
        statusElement.onmouseenter = function () {
            this.style.background = `radial-gradient(circle 150px at center center, ${bkcolor1}, ${bkcolor})`;
            this.style.height = '25px';
            this.style.textShadow = '0 4px 8px rgba(0,0,0,0.3)';
            this.style.letterSpacing = '12px';
            this.style.fontSize = '16px';
            this.style.padding = '4px';
        };

        // 鼠标离开事件
        statusElement.onmouseleave = function () {
            this.style.background = `radial-gradient(circle 0px at center center, ${bkcolor1}, ${bkcolor})`;
            this.style.height = '22px';
            this.style.textShadow = 'none';
            this.style.letterSpacing = '6px';
            this.style.fontSize = '14px';
            this.style.padding = '4px';
        };
    }

    updateIdentityStyle(button, identity) {
        const allstyles = {
            '人类': {
                color: '#00b6b3ff',
            },
            '神明': {
                color: '#dec11cff',
            },
            '其他': {
                color: '#b93aa6ff',
            }
        };
        const styles = allstyles[identity] || styles['人类'];
        button.textContent = identity;
        Object.assign(button.style, {
            color: styles.color,
            letterSpacing: '6px',
            fontSize: '16px',
            transition: 'all 0.3s ease'
        });
    }

    // 渲染角色详情
    renderCharacterDetail(character) {

        this.currentCharacter = character;

        const nameElement = document.getElementById('character-name');
        if (nameElement) {
            nameElement.innerText = this.currentCharacter.name || '';
            nameElement.addEventListener('input', () => {
                this.currentCharacter.name = nameElement.innerText;
            });
        }
        const plElement = document.getElementById('player-name');
        if (plElement) {
            plElement.innerText = this.currentCharacter.player || '';
            plElement.addEventListener('input', () => {
                this.currentCharacter.player = plElement.innerText;
            });
        }
        this.bindInputToCharacter('character-gender', 'gender');
        this.bindInputToCharacter('character-age', 'age');
        this.bindInputToCharacter('character-alignment', 'alignment');
        this.bindInputToCharacter('character-nationality', 'nationality');
        this.bindInputToCharacter('character-class', 'class');
        this.bindInputToCharacter('character-blessing', 'blessing');
        this.bindInputToCharacter('blessingFullName', 'blessingFullName');
        const descElement = document.getElementById('character-description');
        if (descElement) {
            descElement.innerText = this.currentCharacter.description || '';
            descElement.addEventListener('input', () => {
                this.currentCharacter.description = descElement.innerText;
            });
        }
        this.bindInputToCharacter('blessing-level', 'blessinglevel');
        this.bindInputToCharacter('blessing-soul', 'soul');

        // 身份切换按钮绑定
        const isGodButton = document.getElementById('isGod');
        if (isGodButton) {
            this.updateIdentityStyle(isGodButton, this.currentCharacter.isGod || '人类');
            isGodButton.addEventListener('click', () => {
                const identities = ['人类', '神明', '其他'];
                const currentIndex = identities.indexOf(this.currentCharacter.isGod || '人类');
                const nextIndex = (currentIndex + 1) % identities.length;

                this.currentCharacter.isGod = identities[nextIndex];
                isGodButton.textContent = this.currentCharacter.isGod;

                const allstyles = {
                    '人类': {
                        color: '#00b6b3ff',
                    },
                    '神明': {
                        color: '#dec11cff',
                    },
                    '其他': {
                        color: '#b93aa6ff',
                    }
                };
                const styles = allstyles[identities[nextIndex]] || allstyles['人类'];

                Object.assign(isGodButton.style, {
                    color: styles.color,
                    transition: 'all 0.3s ease'
                });

                // 身份变化触发其他逻辑
                this.renderAttributes(this.currentCharacter.attributes, this.currentCharacter.isGod);
            });
        }

        // 动态表格绑定
        this.setupTableBindings();
        this.bindAttributeInputs();

        this.bindLogEvents();

        // 渲染属性
        this.renderAttributes(character.attributes, character.isGod);

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

        // 渲染日志系统
        this.renderLogs(character.logs);

        const customSelects = document.querySelectorAll('.custom-select');
        customSelects.forEach((select) => {
            const selected = select.querySelector('.select-selected');
            const items = select.querySelector('.select-items');
            const originalSelect = select.querySelector('select');
            const options = items.querySelectorAll('.select-item');

            const initialValue = originalSelect.value;
            const initialOption = Array.from(options).find(opt => (opt.getAttribute('data-value') === initialValue) || (!initialValue && !opt.getAttribute('data-value')));
            if (initialOption) {
                selected.textContent = initialOption.textContent;
                options.forEach(opt => opt.classList.remove('select-same-as-selected'));
                initialOption.classList.add('select-same-as-selected');
            }});
    }

    // 渲染属性
    renderAttributes(attributes, isGod) {
        // 渲染前6个属性
        ['STR', 'DEX', 'INT', 'CHA', 'WIS', 'MAG'].forEach(attr => {
            const base = parseInt(attributes[attr].base) || 0;
            const statusAdj = parseInt(attributes[attr].statusAdj) || 0;
            const blessingAdj = parseInt(attributes[attr].blessingAdj) || 0;
            document.getElementById(`attr-${attr}-status`).value = statusAdj;
            document.getElementById(`attr-${attr}-blessing`).value = blessingAdj;
            this.currentCharacter.attributes[attr].statusAdj = statusAdj;
            this.currentCharacter.attributes[attr].blessingAdj = blessingAdj;
            if (isGod === '神明') {
                document.getElementById(`attr-${attr}-base`).value = base;
                this.currentCharacter.attributes[attr].base = base;
                document.getElementById(`attr-${attr}-total`).textContent = Math.max(0, base + statusAdj + blessingAdj);
            } else {
                document.getElementById(`attr-${attr}-base`).value = Math.min(GOGCharacterApp.MAX_ATTRIBUTE_BASE, base);
                this.currentCharacter.attributes[attr].base = Math.min(GOGCharacterApp.MAX_ATTRIBUTE_BASE, base);
                document.getElementById(`attr-${attr}-total`).textContent = Math.min(GOGCharacterApp.MAX_ATTRIBUTE_VALUE, Math.max(0, base + statusAdj + blessingAdj));
            }
        });

        // 渲染健康和魔力
        this.updateMaxValues(isGod);
        this.updateSkillProficiencyLeft();
    }

    // 动态计算属性并显示最大值
    updateMaxValues(isGod) {
        // 获取当前页面上的值
        const strBase = parseInt(document.getElementById('attr-STR-base').value) || 0;
        const strStatus = parseInt(document.getElementById('attr-STR-status').value) || 0;
        const strBlessing = parseInt(document.getElementById('attr-STR-blessing').value) || 0;
        let strTotal = Math.max(0, strBase + strStatus + strBlessing);

        const magBase = parseInt(document.getElementById('attr-MAG-base').value) || 0;
        const magStatus = parseInt(document.getElementById('attr-MAG-status').value) || 0;
        const magBlessing = parseInt(document.getElementById('attr-MAG-blessing').value) || 0;
        let magTotal = Math.max(0, magBase + magStatus + magBlessing);

        if (isGod !== '神明') {
            strTotal = Math.min(GOGCharacterApp.MAX_ATTRIBUTE_VALUE, strTotal);
            magTotal = Math.min(GOGCharacterApp.MAX_ATTRIBUTE_VALUE, magTotal);
        }

        let hpBase = parseInt(document.getElementById('attr-HP-base').value) || 0;
        let mpBase = parseInt(document.getElementById('attr-MP-base').value) || 0;
        if (isGod !== '神明') {
            hpBase = Math.min(GOGCharacterApp.MAX_HP_MP_BASE, hpBase);
            mpBase = Math.min(GOGCharacterApp.MAX_HP_MP_BASE, mpBase);
        }
        this.currentCharacter.attributes.HP.base = hpBase;
        this.currentCharacter.attributes.MP.base = mpBase;

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
            this.currentCharacter.attributes.HP.current = hpMax;
        }

        const mpCurrent = document.getElementById('attr-MP-current');
        if (parseInt(mpCurrent.value) > mpMax) {
            mpCurrent.value = mpMax;
            this.currentCharacter.attributes.MP.current = mpMax;
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
                    if (type === 'base' && this.currentCharacter.isGod !== '神明') {
                        input.value = Math.min(GOGCharacterApp.MAX_ATTRIBUTE_BASE, input.value);
                    }

                    this.currentCharacter.attributes[attr][type] = parseInt(input.value) || 0;
                    this.renderAttributes(this.collectAttributes(), this.currentCharacter.isGod);
                    //this.updateMaxValues();
                    //this.updateSkillProficiencyLeft();
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
                    if (subType === 'base' && this.currentCharacter.isGod !== '神明') {
                        input.value = Math.min(GOGCharacterApp.MAX_HP_MP_BASE, input.value);
                    }

                    this.currentCharacter.attributes[type][subType] = parseInt(input.value) || 0;
                    this.updateMaxValues(this.currentCharacter.isGod);
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

        // 赐福等级信息表格
        this.setupTableBinding('blessing-container', 'blessingSystem', ['level', 'attribute', 'skill', 'corruption']);

        // 赐福特技表格
        this.setupTableBinding('blessing-skills-container', 'blessingSkills', ['name', 'description']);
    }

    setupTableBinding(containerId, property, fields) {
        const container = document.getElementById(containerId);
        container.addEventListener('input', (e) => {
            const row = e.target.closest('tr');
            if (!row) return;
            // 对于技能和装备，需要特殊处理类别
            if (property === 'skills') {
                // 确保有有效的类别
                const category = row.dataset.category;
                const index = parseInt(row.dataset.index);

                if (!category || isNaN(index)) return;

                const inputs = row.querySelectorAll('input, .auto-height-content');
                fields.forEach((field, i) => {
                    let value = inputs[i].value;
                    if (inputs[i].classList.contains('auto-height-content')) {
                        value = inputs[i].innerText;
                    }
                    this.currentCharacter.skills[category][index][field] = this.convertFieldValue(field, value);
                });

                // 安全更新数据
                if (!this.currentCharacter.skills[category]) {
                    this.currentCharacter.skills[category] = [];
                }
            } else if (property === 'inventory') {
                const category = row.dataset.category;
                const index = parseInt(row.dataset.index);

                if (!category || isNaN(index)) return;

                const inputs = row.querySelectorAll('input, .auto-height-content');
                fields.forEach((field, i) => {
                    let value = inputs[i].value;
                    if (inputs[i].classList.contains('auto-height-content')) {
                        value = inputs[i].innerText;
                    }
                    this.currentCharacter.inventory[category][index][field] = this.convertFieldValue(field, value);
                });

                // 安全更新数据
                if (!this.currentCharacter.inventory[category]) {
                    this.currentCharacter.inventory[category] = [];
                }
            }
            else {
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
            }

        });
    }

    // 绑定日志事件方法
    bindLogEvents() {
        if (!this.currentCharacter.logs) {
            this.currentCharacter.logs = [];
        }
        document.getElementById('log-sections').addEventListener('input', (e) => {
            if (e.target.classList.contains('log-title')) {
                const logSection = e.target.closest('.log-section');
                const logId = parseInt(logSection.dataset.id);

                const log = this.currentCharacter.logs.find(l => parseInt(l.id) === logId);
                if (log) log.title = e.target.innerText;
            }
        });

        document.getElementById('log-sections').addEventListener('input', (e) => {
            if (e.target.classList.contains('log-content')) {
                const logSection = e.target.closest('.log-section');
                const logId = parseInt(logSection.dataset.id);

                const log = this.currentCharacter.logs.find(l => parseInt(l.id) === logId);
                if (log) log.content = e.target.innerText;
            }
        });

        document.getElementById('log-sections').addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-log')) {
                const logSection = e.target.closest('.log-section');
                const logId = parseInt(logSection.dataset.id);

                this.currentCharacter.logs = this.currentCharacter.logs.filter(
                    log => parseInt(log.id) !== logId
                );

                this.renderLogs(this.currentCharacter.logs);
            }
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

    // 图片裁剪及压缩方法
    async cropImageToRatio(file, targetRatio) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // 计算裁剪区域
                    const sourceRatio = img.width / img.height;

                    let sourceWidth, sourceHeight, sourceX = 0, sourceY = 0;

                    if (sourceRatio > targetRatio) {
                        // 原图更宽，裁剪左右
                        sourceHeight = img.height;
                        sourceWidth = sourceHeight * targetRatio;
                        sourceX = (img.width - sourceWidth) / 2;
                    } else {
                        // 原图更高，裁剪上下
                        sourceWidth = img.width;
                        sourceHeight = sourceWidth / targetRatio;
                        sourceY = (img.height - sourceHeight) / 2;
                    }

                    // 设置画布大小为200:250比例
                    canvas.width = 400;  // 或您需要的具体像素值
                    canvas.height = 500;

                    // 绘制裁剪后的图像
                    ctx.drawImage(
                        img,
                        sourceX, sourceY,       // 源图像裁剪起点
                        sourceWidth, sourceHeight, // 源图像裁剪尺寸
                        0, 0,                  // 画布起点
                        canvas.width, canvas.height // 画布尺寸
                    );

                    // 转换为Base64
                    resolve(canvas.toDataURL('image/jpeg', 0.9));
                };

                img.onerror = () => reject(new Error('图片加载失败'));
            };

            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsDataURL(file);
        });
    }

    // 渲染赐福系统表格
    renderBlessingSystem(blessingData, blessing) {
        const container = document.getElementById('blessing-container');
        container.innerHTML = '';

        const data = blessingData || Array(5).fill().map((_, i) => ({
            level: '',
            attribute: '',
            skill: '',
            corruption: '',
        }));

        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td class="auto-height-cell">
            <div class="auto-height-content" contenteditable="true" >${row.level || ''}</div></td>
        <td class="auto-height-cell">
            <div class="auto-height-content" contenteditable="true" >${row.attribute || ''}</div>
        </td>
        <td class="auto-height-cell">
            <div class="auto-height-content" contenteditable="true" >${row.skill || ''}</div>
        </td>
        <td class="auto-height-cell"><div class="auto-height-content" contenteditable="true" >${row.corruption || ''}</div></td>
        <td><button class="btn-danger" data-index="${index}">删除</button></td>
      `;
            container.appendChild(tr);
        });
    }

    // 收集赐福表格数据
    collectBlessingData() {
        const container = document.getElementById('blessing-container');
        const rows = container.querySelectorAll('tr');
        const data = [];

        rows.forEach(row => {
            // 获取所有输入元素（input和contenteditable div）
            const levelInput = row.querySelector('td:nth-child(1) .auto-height-content');
            const attributeContent = row.querySelector('td:nth-child(2) .auto-height-content');
            const skillContent = row.querySelector('td:nth-child(3) .auto-height-content');
            const corruptionInput = row.querySelector('td:nth-child(4) .auto-height-content');

            data.push({
                level: levelInput?.innerText.trim() || '',
                attribute: attributeContent?.innerText.trim() || '', // 使用innerText获取div内容
                skill: skillContent?.innerText.trim() || '', // 使用innerText获取div内容
                corruption: corruptionInput?.innerText.trim() || '',
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
        <td class="auto-height-cell"><div class="auto-height-content blessing-skill-name" contenteditable="true">${skill.name || ''}</div></td>
        <td class="auto-height-cell"><div class="auto-height-content blessing-skill-desc" contenteditable="true">${skill.description || ''}</div></td>
        <td><button class="btn-danger" data-index="${index}">删除</button></td>
      `;
            container.appendChild(tr);
        });
    }

    // 权柄特技描述数据收集方法
    collectBlessingSkills() {
        const container = document.getElementById('blessing-skills-container');
        const rows = container.querySelectorAll('tr');
        const data = [];

        rows.forEach(row => {
            data.push({
                name: row.querySelector('.blessing-skill-name').innerText.trim() || '',
                description: row.querySelector('.blessing-skill-desc').innerText.trim() || ''
            });
        });

        return data;
    }

    collectTableData(containerId, fields) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`容器元素未找到: #${containerId}`);
            return [];
        }

        // 特殊处理技能表格
        if (containerId === 'skills-container') {
            return this.collectSkillsData();
        } else if (containerId === 'inventory-container') {
            return this.collectInventoryData();
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
                const input = inputs[index];
                let value;
                if (input.classList.contains('auto-height-content')) {
                    // 处理contenteditable div
                    value = input.innerText.trim();
                } else {
                    value = input.value;
                }
                // 根据字段类型转换值
                item[field] = this.convertFieldValue(field, value);
            });
            data.push(item);
        });

        return data;
    }
    collectSkillsData() {
        const skillsData = {
            PRF: [],
            STR: [],
            DEX: [],
            INT: [],
            CHA: [],
            WIS: [],
            MAG: []
        };

        // 获取所有技能行（跳过类别标题行）
        const container = document.getElementById('skills-container');
        const skillRows = container.querySelectorAll('tr.skill-row');

        skillRows.forEach(row => {
            const category = row.dataset.category;
            const inputs = row.querySelectorAll('input, .auto-height-content');

            if (inputs.length >= 4) { // name, proficiency, uses, description
                const skill = {
                    name: inputs[0].innerText.trim(),
                    proficiency: parseInt(inputs[1].value) || 0,
                    uses: parseInt(inputs[2].value) || 0,
                    description: inputs[3].innerText.trim()
                };

                if (skillsData[category]) {
                    skillsData[category].push(skill);
                }
            }
        });

        return skillsData;
    }
    collectInventoryData() {
        const inventoryData = {
            equipment: [],    // 装备
            food: [],         // 食物
            currency: [],     // 钱币
            medical: [],      // 医疗物品
            potions: [],      // 药剂
            supplies: []      // 储备/其他物品
        };

        // 获取所有技能行（跳过类别标题行）
        const container = document.getElementById('inventory-container');
        const itemRows = container.querySelectorAll('tr.item-row');

        itemRows.forEach(row => {
            const category = row.dataset.category;
            const inputs = row.querySelectorAll('input, .auto-height-content');

            if (inputs.length >= 4) { // name, weight, description, quantity
                const item = {
                    name: inputs[0].innerText.trim(),
                    weight: parseFloat(inputs[1].value) || 0,
                    description: inputs[2].innerText.trim(),
                    quantity: parseFloat(inputs[3].value) || 0,
                };

                if (inventoryData[category]) {
                    inventoryData[category].push(item);
                }
            }
        });

        return inventoryData;
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

    // 删除状态标签
    removeStatusTag(status) {
        this.currentCharacter.status = this.currentCharacter.status.filter(s => s !== status);
        this.renderStatusTags(this.currentCharacter.status);
    }

    // 渲染技能列表
    renderSkills(skillsArray) {
        const skillsContainer = document.getElementById('skills-container');
        skillsContainer.innerHTML = '';

        Object.entries(skillsArray).forEach(([category, skills]) => {
            if (skills.length === 0) return;

            // 添加类别标题行
            const categoryRow = document.createElement('tr');
            categoryRow.className = 'skill-category-row';
            categoryRow.innerHTML = `
            <td colspan="5" class="skill-category-header" style="margin:6px auto;text-align: center;background: #f2f2f2">
                <strong>${this.getCategoryName(category)}类技能</strong>
            </td>
        `;
            skillsContainer.appendChild(categoryRow);

            // 添加该类别下的技能
            skills.forEach((skill, index) => {
                const row = document.createElement('tr');
                row.className = 'skill-row';
                row.dataset.category = category;
                row.dataset.index = index;
                row.innerHTML = `
                <td><div class="auto-height-content" contenteditable="true">${skill.name || ''}</div></td>
                <td><input type="number" min="0" max="5" value="${skill.proficiency || 0}"></td>
                <td><input type="number" min="0" value="${skill.uses || 0}"></td>
                <td><div class="auto-height-content" contenteditable="true">${skill.description || ''}</div></td>
                <td><button class="btn-danger" data-category="${category}" data-index="${index}">删除</button></td>
            `;
                skillsContainer.appendChild(row);
            });
        });
    }

    // 计算熟练总点数
    updateSkillProficiencyLeft() {
        // 计算已分配熟练度
        let usedProficiency = 0;
        const skillsData = this.collectSkillsData();
        if (skillsData) {
            Object.values(skillsData).forEach(categorySkills => {
                categorySkills.forEach(skill => {
                    usedProficiency += parseInt(skill.proficiency) || 0;
                });
            });
        }

        // 更新显示
        const displayElement = document.getElementById('skill-prof-left');
        displayElement.textContent = usedProficiency;
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
      <td><button class="btn-danger" data-index="${index}">删除</button></td>
    `;
            equipmentContainer.appendChild(row);
        });
    }

    // 渲染背包物品
    renderInventory(inventoryArray) {
        const inventoryContainer = document.getElementById('inventory-container');
        inventoryContainer.innerHTML = '';

        Object.entries(inventoryArray).forEach(([category, items]) => {
            if (items.length === 0) return;

            // 添加类别标题行
            const categoryRow = document.createElement('tr');
            categoryRow.className = 'item-category-row';
            categoryRow.innerHTML = `
            <td colspan="5" class="item-category-header" style="margin:6px auto;text-align: center;background: #f2f2f2">
                <strong>${this.getCategoryName(category)}</strong>
            </td>
        `;
            inventoryContainer.appendChild(categoryRow);

            // 添加该类别下的技能
            items.forEach((item, index) => {
                const row = document.createElement('tr');
                row.className = 'item-row';
                row.dataset.category = category;
                row.dataset.index = index;
                row.innerHTML = `
                <td><div class="auto-height-content" contenteditable="true">${item.name || ''}</div></td>
                <td><input type="number" min="0" step="0.5" value="${item.weight || 0}"></td>
                <td><div class="auto-height-content" contenteditable="true">${item.description || ''}</div></td>
                <td><input type="number" min="0" value="${item.quantity || 0}"></td>
                <td><button class="btn-danger" data-category="${category}" data-index="${index}">删除</button></td>
            `;
                inventoryContainer.appendChild(row);
            });
        });
    }

    // 计算总负重
    updateTotalWeight() {
        let totalWeight = 0.0;
        const inventoryData = this.collectInventoryData();
        if (inventoryData) {
            Object.values(inventoryData).forEach(categoryItems => {
                categoryItems.forEach(item => {
                    totalWeight += (parseFloat(item.weight) || 0.0) * (parseFloat(item.quantity) || 0.0);
                });
            });
        }
        const displayElement = document.getElementById('total-weight');
        displayElement.textContent = totalWeight;
    }

    // 渲染日志
    renderLogs(logArray) {
        const container = document.getElementById('log-sections');
        container.innerHTML = '';
        logArray = logArray || [];
        logArray.forEach(log => {
            const logElement = document.createElement('div');
            logElement.className = 'log-section';
            logElement.dataset.id = log.id;
            logElement.innerHTML = `
                <div class="log-header">
                    <div class="log-title auto-height-content" contenteditable="true">${log.title}</div>
                    <button class="delete-log">删除</button>
                </div>
                <div class="log-content auto-height-content" contenteditable="true">${log.content}</div>
            `;
            container.appendChild(logElement);
        });
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

        /* 图鉴相关 */
        // 图鉴按钮点击事件
        document.getElementById('show-roster').addEventListener('click', () => {
            this.toggleRosterPanel();
        });

        document.querySelector('.roster-tabs').addEventListener('click', (e) => {
            const tabBtn = e.target.closest('.tab-btn');
            if (!tabBtn) return;

            // 切换active状态
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            tabBtn.classList.add('active');
            const tabName = tabBtn.dataset.tab;
            document.getElementById(`${tabName}-list`).classList.add('active');

            // 延迟渲染优化性能
            requestAnimationFrame(() => {
                if (tabName === 'blessings' && !document.getElementById('blessings-list').innerHTML) {
                    this.renderBlessingsList();
                } else if (tabName === 'skills' && !document.getElementById('skills-list').innerHTML) {
                    this.renderSkillsList();
                } else if (tabName === 'equipments' && !document.getElementById('equipments-list').innerHTML) {
                    this.renderEquipmentsList();
                } else if (tabName === 'inventory' && !document.getElementById('inventory-list').innerHTML) {
                    this.renderInventoryList();
                }
            });
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

        // 权柄应用
        document.getElementById('blessings-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-apply-blessing')) {
                const blessingName = e.target.closest('.blessing-item').dataset.name;
                this.applyBlessing(blessingName);
            }
        });

        // 技能添加
        document.getElementById('skills-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-add-skill')) {
                const skillData = {
                    name: e.target.dataset.name,
                    class: e.target.dataset.class,
                    description: e.target.dataset.description + "类别：" + e.target.dataset.class,
                };
                this.addSkillToCharacter(skillData);
            }
        });

        // 装备添加
        document.getElementById('equipments-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-add-equipment')) {
                const equipmentData = {
                    name: e.target.dataset.name,
                    type: e.target.dataset.type,
                    modifier: e.target.dataset.modifier,
                    description: e.target.dataset.description
                };
                this.addEquipmentToCharacter(equipmentData);
            }
        });

        // 背包添加
        document.getElementById('inventory-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-add-inventory')) {
                const inventoryData = {
                    name: e.target.dataset.name,
                    weight: e.target.dataset.weight,
                    description: e.target.dataset.description,
                    category: e.target.dataset.category
                };
                this.addInventoryToCharacter(inventoryData);
            }
        });

        // 职业应用
        document.getElementById('classes-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-apply-class')) {
                this.applyClass(e.target.dataset.name, e.target.dataset.category);
            }
        });

        /* 角色、数据相关 */
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
                    name: document.getElementById('character-name').innerText.trim(),
                    player: document.getElementById('player-name').innerText.trim(),
                    gender: document.getElementById('character-gender').value,
                    age: parseInt(document.getElementById('character-age').value),
                    alignment: document.getElementById('character-alignment').value,
                    nationality: document.getElementById('character-nationality').value,
                    class: document.getElementById('character-class').value,
                    blessing: document.getElementById('character-blessing').value,
                    blessingFullName: document.getElementById('blessingFullName').value,
                    description: document.getElementById('character-description').innerText.trim(),
                    blessinglevel: parseInt(document.getElementById('blessing-level').value),
                    blessingSystem: this.collectBlessingData(),
                    blessingSkills: this.collectBlessingSkills(),
                    isGod: this.currentCharacter.isGod || '',
                    soul: parseInt(document.getElementById('blessing-soul').value),
                    attributes: this.collectAttributes(),
                    logs: this.currentCharacter.logs || []
                };

                // 如果是现有角色，保留id
                if (this.currentCharacter && this.currentCharacter.id) {
                    characterData.id = this.currentCharacter.id;
                }

                // 创建/更新角色对象
                const character = new Character(characterData);

                // 收集动态数据（技能、装备、物品）
                character.skills = this.collectSkillsData();
                character.equipment = this.collectTableData('equipment-container', ['name', 'type', 'modifier', 'description']);
                character.inventory = this.collectInventoryData();

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

        document.getElementById('export-word').addEventListener('click', async () => {
            if (this.currentCharacter) {
                await this.dataHandler.exportToWord(this.currentCharacter.id);
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

        // 创建新角色
        document.getElementById('new-character').addEventListener('click', () => {
            this.currentCharacter = new Character();
            this.renderCharacterDetail(this.currentCharacter);
        });

        /* 角色详情相关 */
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
                const croppedImage = await this.cropImageToRatio(file, 200 / 250);
                this.currentCharacter.portrait = croppedImage;
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
            this.currentCharacter.blessinglevel = parseInt(document.getElementById('blessing-level').value) || 0;
        });

        // 添加赐福等级信息表格行处理
        document.getElementById('add-blessingSystem').addEventListener('click', () => {
            this.currentCharacter.blessingSystem.push({
                level: '',
                attribute: '',
                skill: '',
                corruption: ''
            });
            this.renderBlessingSystem(this.currentCharacter.blessingSystem, this.currentCharacter.blessing);
        });

        // 删除赐福等级信息表格行处理
        document.getElementById('blessing-container').addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-danger')) {
                const index = parseInt(e.target.dataset.index);
                this.currentCharacter.blessingSystem.splice(index, 1);
                this.renderBlessingSystem(this.currentCharacter.blessingSystem, this.currentCharacter.blessing);
            }
        });

        // 添加赐福特技表格行处理
        document.getElementById('add-blessingSkills').addEventListener('click', () => {
            this.currentCharacter.blessingSkills.push({
                name: '',
                description: ''
            });
            this.renderBlessingSkills(this.currentCharacter.blessingSkills);
        });

        // 删除赐福特技表格行处理
        document.getElementById('blessing-skills-container').addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-danger')) {
                const index = parseInt(e.target.dataset.index);
                this.currentCharacter.blessingSkills.splice(index, 1);
                this.renderBlessingSkills(this.currentCharacter.blessingSkills);
            }
        });


        // 添加技能
        document.getElementById('add-skill').addEventListener('click', () => {
            const category = document.getElementById('skill-category-select').value;

            if (!this.currentCharacter.skills.hasOwnProperty(category)) {
                this.currentCharacter.skills[category] = [];
                // 确保技能分类顺序正确
                const orderedSkills = {};
                Object.keys(Character.standardSkillsStructure).forEach(key => {
                    orderedSkills[key] = this.currentCharacter.skills[key] || [];
                });
                this.currentCharacter.skills = orderedSkills;
            }

            this.currentCharacter.skills[category].push({
                name: '',
                proficiency: 0,
                uses: 0,
                description: ''
            });
            this.renderSkills(this.currentCharacter.skills);
            this.updateSkillProficiencyLeft();
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
            const category = document.getElementById('item-category-select').value;
            this.currentCharacter.inventory[category].push({
                name: '',
                weight: 0,
                description: '',
                quantity: 1
            });
            this.renderInventory(this.currentCharacter.inventory);
        });

        // 添加日志
        document.getElementById('add-log').addEventListener('click', () => {
            this.currentCharacter.logs.push({
                id: Date.now(),
                title: '',
                content: ''
            });
            this.renderLogs(this.currentCharacter.logs);
        });

        // 删除技能/装备/物品的处理
        document.getElementById('equipment-container').addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-danger')) {
                const index = parseInt(e.target.dataset.index);
                this.currentCharacter.equipment.splice(index, 1);
                this.renderEquipment(this.currentCharacter.equipment);
            }
        });
        document.getElementById('inventory-container').addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-danger')) {
                const category = e.target.dataset.category;
                const index = parseInt(e.target.dataset.index);
                this.currentCharacter.inventory[category].splice(index, 1);
                this.renderInventory(this.currentCharacter.inventory);
                this.updateTotalWeight();
            }
        });
        document.getElementById('skills-container').addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-danger')) {
                const category = e.target.dataset.category;
                const index = parseInt(e.target.dataset.index);
                this.currentCharacter.skills[category].splice(index, 1);
                this.renderSkills(this.currentCharacter.skills);
                this.updateSkillProficiencyLeft();
            }
        });

        // 技能表格变化时更新剩余熟练度
        document.getElementById('skills-container').addEventListener('input', (e) => {
            if (e.target.classList.contains('auto-height-content') ||
                e.target.type === 'number') {
                this.updateSkillProficiencyLeft();
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

        // 自定义select
        const customSelects = document.querySelectorAll('.custom-select');

        // 关闭所有下拉框的函数
        const closeAllSelect = (elmnt) => {
            const selectItems = document.querySelectorAll('.select-items');
            const selectSelected = document.querySelectorAll('.select-selected');

            selectItems.forEach((item) => {
                if (elmnt !== item && elmnt !== item.previousElementSibling) {
                    item.style.display = 'none';
                }
            });

            selectSelected.forEach((select) => {
                if (elmnt !== select) {
                    select.classList.remove('select-arrow-active');
                }
            });
        };

        customSelects.forEach((select) => {
            const selected = select.querySelector('.select-selected');
            const items = select.querySelector('.select-items');
            const originalSelect = select.querySelector('select');
            const options = items.querySelectorAll('.select-item');

            // 点击选择框
            selected.addEventListener('click', (e) => {
                e.stopPropagation();
                closeAllSelect(selected);
                items.style.display = (items.style.display === 'block') ? 'none' : 'block';
                selected.classList.toggle('select-arrow-active');
            });

            // 选项点击
            options.forEach((option) => {
                option.addEventListener('click', (e) => {
                    const value = option.getAttribute('data-value');
                    const text = option.textContent;

                    // 更新显示的选择
                    selected.textContent = text;
                    selected.classList.remove('select-arrow-active');

                    originalSelect.value = value;

                    options.forEach((opt) => {
                        opt.classList.remove('select-same-as-selected');
                    });
                    option.classList.add('select-same-as-selected');

                    const event = new Event('change');
                    originalSelect.dispatchEvent(event);

                    // 隐藏选项列表
                    items.style.display = 'none';
                });
            });
        });

        // 点击页面其他区域关闭所有下拉框
        document.addEventListener('click', (e) => {
            closeAllSelect(e.target);
        });

        // 初始计算
        this.updateMaxValues();
    }
}

// 启动应用
window.onload = () => {
    new GOGCharacterApp();
};
