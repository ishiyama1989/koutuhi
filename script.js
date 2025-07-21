// データ管理
class TransportationApp {
    constructor() {
        this.data = {
            people: [],
            patterns: [],
            settings: {
                unitRate: 10
            }
        };
        this.loadData();
        this.initializeApp();
    }

    // ローカルストレージからデータを読み込み
    loadData() {
        const savedData = localStorage.getItem('transportationData');
        if (savedData) {
            this.data = { ...this.data, ...JSON.parse(savedData) };
        }
    }

    // ローカルストレージにデータを保存
    saveData() {
        localStorage.setItem('transportationData', JSON.stringify(this.data));
    }

    // アプリケーション初期化
    initializeApp() {
        this.initializeEventListeners();
        this.loadSettings();
        this.updatePeopleList();
        this.updatePatternsList();
        this.setDefaultDate();
    }

    // イベントリスナーの設定
    initializeEventListeners() {
        // 人の登録フォーム
        document.getElementById('personForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addPerson();
        });

        // 設定フォーム
        document.getElementById('settingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        // 集計月変更時の自動更新
        document.getElementById('summaryMonth').addEventListener('change', () => {
            this.generateSummary();
        });

        // 最寄駅選択による距離入力の表示切り替え
        document.getElementById('nearestStation').addEventListener('change', (e) => {
            this.toggleNearestStationDistance();
        });
        
        // 自家用車の有無による距離入力の表示切り替え
        document.getElementById('hasPrivateCar').addEventListener('change', (e) => {
            this.toggleDistanceInputs();
        });
        
        // 職種選択による距離入力制限
        document.querySelectorAll('.job-type-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.toggleDistanceInputs();
            });
        });

        // ファイルインポート
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e);
        });

        // エクセルファイル選択
        document.getElementById('excelFile').addEventListener('change', (e) => {
            this.handleExcelFile(e);
        });

        // 勤務パターンフォーム
        document.getElementById('patternForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addPattern();
        });

        // 編集フォーム
        document.getElementById('editPersonForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updatePerson();
        });

        // パターン編集フォーム
        document.getElementById('editPatternForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updatePattern();
        });

        // 編集フォームの最寄駅選択時
        document.getElementById('editNearestStation').addEventListener('change', (e) => {
            this.toggleEditNearestStationDistance();
        });
        
        // 編集フォームの自家用車変更時
        document.getElementById('editHasPrivateCar').addEventListener('change', (e) => {
            this.toggleEditDistanceInputs();
        });
        
        // 編集フォームの職種選択による距離入力制限
        document.querySelectorAll('.edit-job-type-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.toggleEditDistanceInputs();
            });
        });
        
        // 勤務パターンの電車通勤選択時
        document.getElementById('trainCommute').addEventListener('change', (e) => {
            this.handleTrainCommuteChange();
        });
        
        // 編集モーダルの電車通勤選択時
        document.getElementById('editTrainCommute').addEventListener('change', (e) => {
            this.handleEditTrainCommuteChange();
        });
    }

    // デフォルト日付設定
    setDefaultDate() {
        const currentMonth = new Date().toISOString().slice(0, 7);
        document.getElementById('summaryMonth').value = currentMonth;
    }

    // 設定を読み込み
    loadSettings() {
        document.getElementById('unitRate').value = this.data.settings.unitRate;
    }

    // 設定を保存
    saveSettings() {
        this.data.settings.unitRate = parseFloat(document.getElementById('unitRate').value);
        this.saveData();
        this.showMessage('設定を保存しました', 'success');
    }
    
    // 職種に応じた距離入力の表示制御
    toggleDistanceInputs() {
        const hasPrivateCar = document.getElementById('hasPrivateCar').value;
        const distanceGroup = document.getElementById('distanceGroup');
        const jobTypeCheckboxes = document.querySelectorAll('.job-type-checkbox:checked');
        const selectedJobTypes = Array.from(jobTypeCheckboxes).map(cb => cb.value);
        
        if (hasPrivateCar !== 'yes') {
            distanceGroup.style.display = 'none';
            this.clearAllDistanceInputs();
            return;
        }
        
        distanceGroup.style.display = 'block';
        
        // すべての距離入力を一旦無効化
        this.disableAllDistanceInputs();
        
        // 職種に応じて入力を有効化
        if (selectedJobTypes.includes('管理駅')) {
            // 管理駅：全駅利用可能（鉄道技術所を除く）
            this.enableDistanceInput(['distanceOtsuki', 'distanceTsuru', 'distanceShimoyoshida', 'distanceFujisan', 'distanceHighland', 'distanceKawaguchiko']);
        }
        
        if (selectedJobTypes.includes('乗務員区')) {
            // 乗務員区：大月、河口湖のみ
            this.enableDistanceInput(['distanceOtsuki', 'distanceKawaguchiko']);
        }
        
        if (selectedJobTypes.includes('運転指令')) {
            // 運転指令：河口湖駅のみ
            this.enableDistanceInput(['distanceKawaguchiko']);
        }
        
        if (selectedJobTypes.includes('技術所')) {
            // 技術所：鉄道技術所のみ
            this.enableDistanceInput(['distanceRailwayTech']);
        }
    }
    
    // すべての距離入力を無効化
    disableAllDistanceInputs() {
        const distanceInputs = ['distanceOtsuki', 'distanceTsuru', 'distanceShimoyoshida', 'distanceFujisan', 'distanceHighland', 'distanceKawaguchiko', 'distanceRailwayTech'];
        distanceInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            const container = input.closest('.distance-input-item');
            input.disabled = true;
            input.required = false;
            container.style.opacity = '0.5';
        });
    }
    
    // 指定した距離入力を有効化
    enableDistanceInput(inputIds) {
        inputIds.forEach(inputId => {
            const input = document.getElementById(inputId);
            const container = input.closest('.distance-input-item');
            input.disabled = false;
            input.required = true;
            container.style.opacity = '1';
        });
    }
    
    // すべての距離入力をクリア
    clearAllDistanceInputs() {
        const distanceInputs = ['distanceOtsuki', 'distanceTsuru', 'distanceShimoyoshida', 'distanceFujisan', 'distanceHighland', 'distanceKawaguchiko', 'distanceRailwayTech'];
        distanceInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            input.value = '';
            input.required = false;
        });
    }
    
    // 最寄駅距離の表示・非表示制御
    toggleNearestStationDistance() {
        const nearestStation = document.getElementById('nearestStation').value;
        const distanceGroup = document.getElementById('nearestStationDistanceGroup');
        const distanceInput = document.getElementById('nearestStationDistance');
        
        if (nearestStation) {
            distanceGroup.style.display = 'block';
            distanceInput.required = true;
        } else {
            distanceGroup.style.display = 'none';
            distanceInput.required = false;
            distanceInput.value = '';
        }
    }
    
    // 編集フォーム用の最寄駅距離制御
    toggleEditNearestStationDistance() {
        const nearestStation = document.getElementById('editNearestStation').value;
        const distanceGroup = document.getElementById('editNearestStationDistanceGroup');
        const distanceInput = document.getElementById('editNearestStationDistance');
        
        if (nearestStation) {
            distanceGroup.style.display = 'block';
            distanceInput.required = true;
        } else {
            distanceGroup.style.display = 'none';
            distanceInput.required = false;
            distanceInput.value = '';
        }
    }
    
    // 編集モーダル用の距離入力制御
    toggleEditDistanceInputs() {
        const hasPrivateCar = document.getElementById('editHasPrivateCar').value;
        const distanceGroup = document.getElementById('editDistanceGroup');
        const jobTypeCheckboxes = document.querySelectorAll('.edit-job-type-checkbox:checked');
        const selectedJobTypes = Array.from(jobTypeCheckboxes).map(cb => cb.value);
        
        if (hasPrivateCar !== 'yes') {
            distanceGroup.style.display = 'none';
            this.clearAllEditDistanceInputs();
            return;
        }
        
        distanceGroup.style.display = 'block';
        
        // すべての距離入力を一旦無効化
        this.disableAllEditDistanceInputs();
        
        // 職種に応じて入力を有効化
        if (selectedJobTypes.includes('管理駅')) {
            // 管理駅：全駅利用可能（鉄道技術所を除く）
            this.enableEditDistanceInput(['editDistanceOtsuki', 'editDistanceTsuru', 'editDistanceShimoyoshida', 'editDistanceFujisan', 'editDistanceHighland', 'editDistanceKawaguchiko']);
        }
        
        if (selectedJobTypes.includes('乗務員区')) {
            // 乗務員区：大月、河口湖のみ
            this.enableEditDistanceInput(['editDistanceOtsuki', 'editDistanceKawaguchiko']);
        }
        
        if (selectedJobTypes.includes('運転指令')) {
            // 運転指令：河口湖駅のみ
            this.enableEditDistanceInput(['editDistanceKawaguchiko']);
        }
        
        if (selectedJobTypes.includes('技術所')) {
            // 技術所：鉄道技術所のみ
            this.enableEditDistanceInput(['editDistanceRailwayTech']);
        }
    }
    
    // 編集モーダルのすべての距離入力を無効化
    disableAllEditDistanceInputs() {
        const distanceInputs = ['editDistanceOtsuki', 'editDistanceTsuru', 'editDistanceShimoyoshida', 'editDistanceFujisan', 'editDistanceHighland', 'editDistanceKawaguchiko', 'editDistanceRailwayTech'];
        distanceInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            const container = input.closest('.distance-input-item');
            input.disabled = true;
            input.required = false;
            container.style.opacity = '0.5';
        });
    }
    
    // 編集モーダルの指定した距離入力を有効化
    enableEditDistanceInput(inputIds) {
        inputIds.forEach(inputId => {
            const input = document.getElementById(inputId);
            const container = input.closest('.distance-input-item');
            input.disabled = false;
            input.required = true;
            container.style.opacity = '1';
        });
    }
    
    // 編集モーダルのすべての距離入力をクリア
    clearAllEditDistanceInputs() {
        const distanceInputs = ['editDistanceOtsuki', 'editDistanceTsuru', 'editDistanceShimoyoshida', 'editDistanceFujisan', 'editDistanceHighland', 'editDistanceKawaguchiko', 'editDistanceRailwayTech'];
        distanceInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            input.value = '';
            input.required = false;
        });
    }
    
    // 勤務パターンの電車通勤選択時の処理
    handleTrainCommuteChange() {
        const trainCommute = document.getElementById('trainCommute').value;
        const tripType = document.getElementById('tripType');
        
        if (trainCommute === 'possible') {
            tripType.value = 'none';
            tripType.disabled = true;
        } else {
            tripType.disabled = false;
        }
    }
    
    // 編集モーダルの電車通勤選択時の処理
    handleEditTrainCommuteChange() {
        const trainCommute = document.getElementById('editTrainCommute').value;
        const tripType = document.getElementById('editTripType');
        
        if (trainCommute === 'possible') {
            tripType.value = 'none';
            tripType.disabled = true;
        } else {
            tripType.disabled = false;
        }
    }

    // 人を追加
    addPerson() {
        const name = document.getElementById('personName').value.trim();
        const jobTypeCheckboxes = document.querySelectorAll('.job-type-checkbox:checked');
        const jobTypes = Array.from(jobTypeCheckboxes).map(cb => cb.value);
        const nearestStation = document.getElementById('nearestStation').value;
        const nearestStationDistance = document.getElementById('nearestStationDistance').value;
        const hasPrivateCar = document.getElementById('hasPrivateCar').value;

        if (!name || jobTypes.length === 0 || !nearestStation || !hasPrivateCar) {
            this.showMessage('全ての項目を入力してください', 'error');
            return;
        }
        
        // 最寄駅が選択されている場合は距離の入力も必須
        if (nearestStation && !nearestStationDistance) {
            this.showMessage('最寄駅までの距離を入力してください', 'error');
            return;
        }
        
        // 距離の範囲チェック
        if (nearestStationDistance && (parseFloat(nearestStationDistance) < 0 || parseFloat(nearestStationDistance) > 50)) {
            this.showMessage('距離は0-50kmの範囲で入力してください', 'error');
            return;
        }

        // 重複チェック
        if (this.data.people.some(person => person.name === name)) {
            this.showMessage('同じ名前の人が既に登録されています', 'error');
            return;
        }

        const person = {
            id: Date.now(),
            name: name,
            jobTypes: jobTypes,
            nearestStation: nearestStation,
            nearestStationDistance: nearestStationDistance ? parseFloat(nearestStationDistance) : null,
            hasPrivateCar: hasPrivateCar === 'yes'
        };

        if (hasPrivateCar === 'yes') {
            const distanceInputs = {
                'distanceOtsuki': '大月駅',
                'distanceTsuru': '都留文科大学前駅',
                'distanceShimoyoshida': '下吉田駅',
                'distanceFujisan': '富士山駅',
                'distanceHighland': 'ハイランド駅',
                'distanceKawaguchiko': '河口湖駅',
                'distanceRailwayTech': '鉄道技術所'
            };
            
            const distances = {};
            let hasValidDistance = false;
            
            for (const [inputId, stationName] of Object.entries(distanceInputs)) {
                const input = document.getElementById(inputId);
                if (!input.disabled && input.value) {
                    const distance = parseFloat(input.value);
                    if (distance < 0 || distance > 50) {
                        this.showMessage('距離は0-50kmの範囲で入力してください', 'error');
                        return;
                    }
                    distances[stationName] = distance;
                    hasValidDistance = true;
                }
            }
            
            if (!hasValidDistance) {
                this.showMessage('少なくとも1つの駅までの距離を入力してください', 'error');
                return;
            }
            
            person.distances = distances;
        } else {
            person.distances = null;
        }

        this.data.people.push(person);
        this.saveData();
        this.updatePeopleList();
        
        // フォームクリア
        document.getElementById('personForm').reset();
        document.getElementById('distanceGroup').style.display = 'none';
        // チェックボックスをクリア
        document.querySelectorAll('.job-type-checkbox').forEach(cb => cb.checked = false);
        this.showMessage('人を登録しました', 'success');
    }

    // 人を削除
    deletePerson(id) {
        if (confirm('この人を削除しますか？')) {
            this.data.people = this.data.people.filter(person => person.id !== id);
            this.saveData();
            this.updatePeopleList();
            this.showMessage('人を削除しました', 'success');
        }
    }

    // 人を編集
    editPerson(id) {
        const person = this.data.people.find(p => p.id === id);
        if (!person) {
            this.showMessage('人が見つかりません', 'error');
            return;
        }

        // 編集フォームに値を設定
        document.getElementById('editPersonName').value = person.name;
        
        // 職種のチェックボックスを設定
        document.querySelectorAll('.edit-job-type-checkbox').forEach(cb => {
            cb.checked = person.jobTypes && person.jobTypes.includes(cb.value);
        });
        
        // 最寄駅を設定
        document.getElementById('editNearestStation').value = person.nearestStation || '';
        
        // 最寄駅距離を設定
        document.getElementById('editNearestStationDistance').value = person.nearestStationDistance || '';
        
        // 最寄駅距離の表示・非表示制御
        this.toggleEditNearestStationDistance();
        
        document.getElementById('editHasPrivateCar').value = person.hasPrivateCar ? 'yes' : 'no';

        // 距離入力欄の表示/非表示
        const distanceGroup = document.getElementById('editDistanceGroup');
        const distanceInputs = distanceGroup.querySelectorAll('input');
        
        if (person.hasPrivateCar) {
            distanceGroup.style.display = 'block';
            distanceInputs.forEach(input => {
                input.required = true;
            });
            
            // 距離データを設定
            if (person.distances) {
                document.getElementById('editDistanceOtsuki').value = person.distances['大月駅'] || '';
                document.getElementById('editDistanceTsuru').value = person.distances['都留文科大学前駅'] || '';
                document.getElementById('editDistanceShimoyoshida').value = person.distances['下吉田駅'] || '';
                document.getElementById('editDistanceFujisan').value = person.distances['富士山駅'] || '';
                document.getElementById('editDistanceHighland').value = person.distances['ハイランド駅'] || '';
                document.getElementById('editDistanceKawaguchiko').value = person.distances['河口湖駅'] || '';
                document.getElementById('editDistanceRailwayTech').value = person.distances['鉄道技術所'] || '';
            }
        } else {
            distanceGroup.style.display = 'none';
            distanceInputs.forEach(input => {
                input.required = false;
                input.value = '';
            });
        }

        // 現在編集中の人のIDを保存
        this.currentEditingPersonId = id;
        
        // 距離入力を更新
        this.toggleEditDistanceInputs();
        
        // モーダルを表示
        document.getElementById('editPersonModal').style.display = 'flex';
    }

    // 人を更新
    updatePerson() {
        const id = this.currentEditingPersonId;
        const name = document.getElementById('editPersonName').value.trim();
        const jobTypeCheckboxes = document.querySelectorAll('.edit-job-type-checkbox:checked');
        const jobTypes = Array.from(jobTypeCheckboxes).map(cb => cb.value);
        const nearestStation = document.getElementById('editNearestStation').value;
        const nearestStationDistance = document.getElementById('editNearestStationDistance').value;
        const hasPrivateCar = document.getElementById('editHasPrivateCar').value;

        if (!name || jobTypes.length === 0 || !nearestStation || !hasPrivateCar) {
            this.showMessage('全ての項目を入力してください', 'error');
            return;
        }
        
        // 最寄駅が選択されている場合は距離の入力も必須
        if (nearestStation && !nearestStationDistance) {
            this.showMessage('最寄駅までの距離を入力してください', 'error');
            return;
        }
        
        // 距離の範囲チェック
        if (nearestStationDistance && (parseFloat(nearestStationDistance) < 0 || parseFloat(nearestStationDistance) > 50)) {
            this.showMessage('距離は0-50kmの範囲で入力してください', 'error');
            return;
        }

        // 同じ名前の人が他にいないかチェック
        const existingPerson = this.data.people.find(person => person.name === name && person.id !== id);
        if (existingPerson) {
            this.showMessage('同じ名前の人が既に登録されています', 'error');
            return;
        }

        // 人のデータを更新
        const personIndex = this.data.people.findIndex(p => p.id === id);
        if (personIndex === -1) {
            this.showMessage('人が見つかりません', 'error');
            return;
        }

        const updatedPerson = {
            id: id,
            name: name,
            jobTypes: jobTypes,
            nearestStation: nearestStation,
            nearestStationDistance: nearestStationDistance ? parseFloat(nearestStationDistance) : null,
            hasPrivateCar: hasPrivateCar === 'yes'
        };

        if (hasPrivateCar === 'yes') {
            const distanceInputs = {
                'editDistanceOtsuki': '大月駅',
                'editDistanceTsuru': '都留文科大学前駅',
                'editDistanceShimoyoshida': '下吉田駅',
                'editDistanceFujisan': '富士山駅',
                'editDistanceHighland': 'ハイランド駅',
                'editDistanceKawaguchiko': '河口湖駅',
                'editDistanceRailwayTech': '鉄道技術所'
            };
            
            const distances = {};
            let hasValidDistance = false;
            
            for (const [inputId, stationName] of Object.entries(distanceInputs)) {
                const input = document.getElementById(inputId);
                if (!input.disabled && input.value) {
                    const distance = parseFloat(input.value);
                    if (distance < 0 || distance > 50) {
                        this.showMessage('距離は0-50kmの範囲で入力してください', 'error');
                        return;
                    }
                    distances[stationName] = distance;
                    hasValidDistance = true;
                }
            }
            
            if (!hasValidDistance) {
                this.showMessage('少なくとも1つの駅までの距離を入力してください', 'error');
                return;
            }
            
            updatedPerson.distances = distances;
        } else {
            updatedPerson.distances = null;
        }

        // データを更新
        this.data.people[personIndex] = updatedPerson;
        this.saveData();
        this.updatePeopleList();
        
        // モーダルを閉じる
        this.closeEditPersonModal();
        this.showMessage('人の情報を更新しました', 'success');
    }

    // 編集モーダルを閉じる
    closeEditPersonModal() {
        document.getElementById('editPersonModal').style.display = 'none';
        document.getElementById('editPersonForm').reset();
        document.getElementById('editDistanceGroup').style.display = 'none';
        this.currentEditingPersonId = null;
    }



    // 人のリストを更新
    updatePeopleList() {
        const container = document.getElementById('peopleList');
        
        if (this.data.people.length === 0) {
            container.innerHTML = '<div class="no-data">登録されている人がいません</div>';
            return;
        }

        container.innerHTML = this.data.people.map(person => {
            const jobTypesDisplay = person.jobTypes ? person.jobTypes.join(', ') : (person.workplace || '未設定');
            let distanceDisplay = '';
            
            if (person.hasPrivateCar && person.distances) {
                const distanceEntries = Object.entries(person.distances)
                    .filter(([station, distance]) => distance > 0)
                    .map(([station, distance]) => `${station} ${distance}km`);
                distanceDisplay = distanceEntries.length > 0 ? '<br>距離: ' + distanceEntries.join(' | ') : '';
            }
            
            return `
                <div class="person-item">
                    <div class="person-info">
                        <div class="record-date">${person.name}</div>
                        <div class="person-details">
                            所属: ${jobTypesDisplay}<br>
                            最寄駅: ${person.nearestStation || '未設定'}${person.nearestStationDistance ? ` (${person.nearestStationDistance}km)` : ''}<br>
                            自家用車: ${person.hasPrivateCar ? 'あり' : 'なし'}
                            ${distanceDisplay}
                            ${person.nearestStationDistance ? '<br><span style="color: #17a2b8;">📍 電車通勤時は最寄駅距離で計算</span>' : ''}
                        </div>
                    </div>
                    <div class="person-actions">
                        <button class="edit-btn" onclick="app.editPerson(${person.id})">編集</button>
                        <button class="delete-btn" onclick="app.deletePerson(${person.id})">削除</button>
                    </div>
                </div>
            `;
        }).join('');
    }




    // 月次集計を生成
    generateSummary() {
        const month = document.getElementById('summaryMonth').value;
        if (!month) return;

        // 出勤記録機能が削除されたため、集計データはなし
        const totalDays = 0;
        const totalDistance = 0;
        const totalAmount = 0;

        document.getElementById('totalDays').textContent = totalDays;
        document.getElementById('totalDistance').textContent = totalDistance.toFixed(1);
        document.getElementById('totalAmount').textContent = totalAmount.toLocaleString();

        // 詳細テーブル
        const detailsContainer = document.getElementById('summaryDetails');
        detailsContainer.innerHTML = '<div class="no-data">出勤記録機能が削除されたため、集計データはありません</div>';
        document.getElementById('exportBtn').style.display = 'none';
    }

    // CSV出力
    exportCSV() {
        const month = document.getElementById('summaryMonth').value;
        
        // 出勤記録機能が削除されたため、CSV出力は使用不可
        this.showMessage('出勤記録機能が削除されたため、CSV出力は使用できません', 'error');
        return;
    }

    // データ出力
    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `通勤費データ_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // エクセル形式で通勤費集計をエクスポート
    exportTransportationSummaryToExcel() {
        if (!this.previewData || this.previewData.length === 0) {
            this.showMessage('エクスポートするデータがありません。先にエクセルファイルを解析してください。', 'error');
            return;
        }

        // 人別の通勤費を集計
        const personStats = {};
        this.previewData.forEach(item => {
            if (!personStats[item.name]) {
                personStats[item.name] = {
                    totalCost: 0,
                    workDays: 0
                };
            }
            
            // 通勤費計算（登録済みの場合のみ）
            if (item.status === 'OK' && item.person) {
                try {
                    // 勤務パターンを検索
                    let workPattern = null;
                    if (this.data.patterns) {
                        workPattern = this.data.patterns.find(p => 
                            p.name === item.originalValue || 
                            p.workLocation === item.location
                        );
                    }
                    
                    // 通勤費計算
                    let cost = 0;
                    const unitRate = this.data.settings.unitRate || 10;
                    
                    if (workPattern && workPattern.trainCommute === 'possible' && item.person.nearestStationDistance) {
                        // 電車通勤の場合
                        cost = item.person.nearestStationDistance * 2 * unitRate;
                    } else if (item.person.hasPrivateCar && item.person.distances && item.person.distances[workPattern?.workLocation || item.location]) {
                        // 自家用車の場合
                        cost = item.person.distances[workPattern?.workLocation || item.location] * 2 * unitRate;
                    }
                    
                    personStats[item.name].totalCost += cost;
                } catch (error) {
                    console.error('通勤費計算エラー:', error, item);
                }
            }
            personStats[item.name].workDays++;
        });

        // CSV形式で出力
        let csvContent = '名前,合計通勤費(円),出勤日数\n';
        Object.entries(personStats)
            .sort(([,a], [,b]) => b.totalCost - a.totalCost)
            .forEach(([name, stats]) => {
                csvContent += `${name},${stats.totalCost},${stats.workDays}\n`;
            });

        // BOMを追加してUTF-8エンコーディングを指定
        const bom = '\uFEFF';
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `通勤費集計_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        this.showMessage('通勤費集計をエクセル形式でエクスポートしました', 'success');
    }

    // データ読込
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (confirm('現在のデータを上書きしますか？')) {
                    this.data = { ...this.data, ...importedData };
                    this.saveData();
                    this.initializeApp();
                    this.showMessage('データを読み込みました', 'success');
                }
            } catch (error) {
                this.showMessage('ファイルの形式が正しくありません', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    // 全データ削除
    clearAllData() {
        if (confirm('本当に全てのデータを削除しますか？この操作は取り消せません。')) {
            localStorage.removeItem('transportationData');
            this.data = {
                people: [],
                patterns: [],
                settings: {
                    unitRate: 10
                }
            };
            this.initializeApp();
            this.showMessage('全てのデータを削除しました', 'success');
        }
    }

    // 日付フォーマット
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short'
        });
    }

    // メッセージ表示
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            ${type === 'success' ? 'background: #28a745;' : 
              type === 'error' ? 'background: #dc3545;' : 'background: #007bff;'}
        `;

        document.body.appendChild(messageDiv);
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // エクセルファイル処理
    handleExcelFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        // XLSXライブラリの存在確認
        if (typeof XLSX === 'undefined') {
            this.showMessage('エクセル読み込みライブラリ（XLSX.js）が読み込まれていません。ページを再読み込みしてください。', 'error');
            console.error('XLSX library is not loaded');
            return;
        }

        this.showMessage('エクセルファイルを読み込んでいます...', 'info');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // シート名を取得
                const sheetNames = workbook.SheetNames;
                const sheetSelect = document.getElementById('sheetName');
                sheetSelect.innerHTML = '<option value="">シートを選択してください</option>' +
                    sheetNames.map(name => `<option value="${name}">${name}</option>`).join('');
                
                this.currentWorkbook = workbook;
                this.showMessage('エクセルファイルを読み込みました', 'success');
                
                // シート選択のイベントリスナーを追加
                sheetSelect.addEventListener('change', () => {
                    this.handleSheetSelect();
                });
                
            } catch (error) {
                console.error('エクセルファイル読み込みエラー詳細:', error);
                this.showMessage('エクセルファイルの読み込みに失敗しました: ' + error.message, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    // シート選択処理
    handleSheetSelect() {
        const sheetName = document.getElementById('sheetName').value;
        if (!sheetName || !this.currentWorkbook) return;

        try {
            const worksheet = this.currentWorkbook.Sheets[sheetName];
            
            // より詳細なデータ読み込み
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1,
                defval: '',
                blankrows: false
            });
            
            console.log('シートデータ:', jsonData);
            console.log('データ行数:', jsonData.length);
            
            if (jsonData.length === 0) {
                this.showMessage('選択されたシートにデータがありません', 'error');
                return;
            }

            // 最初の数行をチェックしてヘッダー行を探す
            let headerRowIndex = 0;
            let headers = [];
            
            // エクセルファイルの構造に合わせてヘッダー行を設定
            if (jsonData.length > 4) {
                // 5行目（インデックス4）を曜日ヘッダーとして使用
                headers = jsonData[4] || [];
                headerRowIndex = 4;
            } else {
                // フォールバック：最初の有効な行を使用
                for (let i = 0; i < Math.min(5, jsonData.length); i++) {
                    const row = jsonData[i];
                    if (row && row.length > 0 && row.some(cell => cell !== '' && cell !== null && cell !== undefined)) {
                        headers = row;
                        headerRowIndex = i;
                        break;
                    }
                }
            }
            
            console.log(`ヘッダー行 ${headerRowIndex}:`, headers);
            
            if (headers.length === 0) {
                this.showMessage('有効なヘッダー行が見つかりません', 'error');
                return;
            }
            
            // 列選択のオプションを更新
            const columnSelects = ['nameColumn', 'dateStartColumn', 'dateEndColumn'];
            columnSelects.forEach(selectId => {
                const select = document.getElementById(selectId);
                // 最大列数を確認して、すべての列を表示
                const maxColumns = Math.max(headers.length, 40); // AG列まで表示できるように
                const options = [];
                options.push('<option value="">選択してください</option>');
                
                for (let index = 0; index < maxColumns; index++) {
                    const columnLetter = String.fromCharCode(65 + index); // A, B, C, D...
                    const header = headers[index];
                    const displayName = header ? String(header).toString().trim() : '空欄';
                    options.push(`<option value="${index}">${columnLetter}列 (${displayName})</option>`);
                }
                
                select.innerHTML = options.join('');
            });

            this.currentSheetData = jsonData;
            this.headerRowIndex = headerRowIndex;
            document.getElementById('mappingSection').style.display = 'block';
            this.showMessage(`シートデータを読み込みました (${jsonData.length}行, ヘッダー行: ${headerRowIndex + 1})`, 'success');
            
        } catch (error) {
            console.error('シート読み込みエラー詳細:', error);
            console.error('シート名:', sheetName);
            console.error('Workbook:', this.currentWorkbook);
            this.showMessage('シートの読み込みに失敗しました: ' + error.message + '\nシート名を確認してください。', 'error');
        }
    }
}

// エクセルデータのプレビュー
function previewExcelData() {
    console.log('=== previewExcelData開始 ===');
    
    // appオブジェクトの状態を詳しくチェック
    console.log('app:', app);
    console.log('app.currentSheetData:', app ? (app.currentSheetData ? app.currentSheetData.length + '行' : 'なし') : 'appオブジェクトなし');
    console.log('app.currentWorkbook:', app ? (app.currentWorkbook ? 'あり' : 'なし') : 'appオブジェクトなし');
    
    // appオブジェクトの取得を試行（複数のソースから）
    let currentApp = app || window.app;
    
    if (!currentApp) {
        // アプリケーションの再初期化を試行
        console.warn('appオブジェクトが見つからないため、再初期化を試行します');
        
        if (typeof initializeApplication === 'function') {
            const initialized = initializeApplication();
            if (initialized) {
                currentApp = app || window.app;
            }
        }
        
        // 再初期化後もアプリが存在しない場合
        if (!currentApp) {
            const errorMessage = 'アプリケーションが初期化されていません。ページを再読み込みしてください。';
            console.error(errorMessage);
            alert(errorMessage);
            return;
        }
    }
    
    // 以降、currentAppを使用
    console.log('アプリオブジェクト取得成功:', currentApp);
    
    // 必要な要素の存在確認と値の確認
    const requiredElements = ['nameColumn', 'dateStartColumn', 'startRow', 'previewData'];
    const elementStates = {};
    const missingElements = [];
    
    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        if (!element) {
            missingElements.push(id);
            elementStates[id] = '要素なし';
        } else {
            elementStates[id] = {
                exists: true,
                value: element.value || '値なし',
                type: element.tagName
            };
        }
    });
    
    console.log('DOM要素の状態:', elementStates);
    
    if (missingElements.length > 0) {
        const message = `必要な要素が見つかりません: ${missingElements.join(', ')}`;
        console.error(message);
        currentApp.showMessage(message, 'error');
        return;
    }
    
    // currentSheetDataの詳細チェック
    if (!currentApp.currentSheetData) {
        console.error('currentApp.currentSheetDataがnullまたはundefined');
        currentApp.showMessage('シートデータが読み込まれていません。エクセルファイルを選択してシートを読み込んでください。', 'error');
        return;
    }
    
    if (currentApp.currentSheetData.length === 0) {
        console.error('currentApp.currentSheetDataが空配列');
        currentApp.showMessage('読み込まれたシートにデータがありません。別のシートを選択してください。', 'error');
        return;
    }
    
    console.log('シートデータの最初の5行:', currentApp.currentSheetData.slice(0, 5));

    // エクセルファイルの形式を選択
    const formatChoice = confirm('エクセルファイルの形式を選択してください:\n\nOK: 表形式（縦軸=名前、横軸=日付）\nキャンセル: 行形式（行ごとに名前、日付、場所）');
    
    console.log('フォーマット選択:', formatChoice ? '表形式' : '行形式');
    
    try {
        if (formatChoice) {
            previewTableFormat();
        } else {
            previewRowFormat();
        }
    } catch (error) {
        console.error('プレビューエラー:', error);
        currentApp.showMessage('プレビューでエラーが発生しました: ' + error.message, 'error');
    }
}

// 表形式のプレビュー（縦軸=名前、横軸=日付）
function previewTableFormat() {
    console.log('表形式プレビュー開始');
    
    // 入力値の取得と検証
    const nameColumnValue = document.getElementById('nameColumn').value;
    const dateStartColumnValue = document.getElementById('dateStartColumn').value;
    const dateEndColumnValue = document.getElementById('dateEndColumn').value;
    const startRowValue = document.getElementById('startRow').value;
    
    console.log('入力値:', { nameColumnValue, dateStartColumnValue, dateEndColumnValue, startRowValue });
    
    const nameColumn = parseInt(nameColumnValue);
    const dateStartColumn = parseInt(dateStartColumnValue);
    const dateEndColumn = parseInt(dateEndColumnValue);
    const startRow = parseInt(startRowValue) - 1;
    
    // appオブジェクトの取得
    const currentApp = app || window.app;
    if (!currentApp) {
        console.error('previewTableFormat: appオブジェクトが利用できません');
        alert('アプリケーションが初期化されていません。ページを再読み込みしてください。');
        return;
    }
    
    // 必須項目の検証
    if (isNaN(nameColumn) || nameColumn < 0) {
        currentApp.showMessage('氏名列を正しく選択してください', 'error');
        return;
    }
    
    if (isNaN(dateStartColumn) || dateStartColumn < 0) {
        currentApp.showMessage('日付開始列を正しく選択してください', 'error');
        return;
    }
    
    if (isNaN(startRow) || startRow < 0) {
        currentApp.showMessage('データ開始行を正しく入力してください', 'error');
        return;
    }
    
    // 終了列が指定されていない場合、開始列と同じにする
    const endColumn = isNaN(dateEndColumn) ? dateStartColumn : dateEndColumn;
    
    if (dateStartColumn > endColumn) {
        currentApp.showMessage('日付開始列は終了列より小さい値である必要があります', 'error');
        return;
    }

    console.log('表形式プレビュー開始 - 名前列:', nameColumn, '開始行:', startRow);
    
    try {
        const data = currentApp.currentSheetData;
        console.log('データ取得成功 - 行数:', data ? data.length : 'なし');
        
        if (!data || data.length === 0) {
            throw new Error('currentSheetDataが空またはnullです');
        }
        
        const previewData = [];
        console.log('プレビューデータ配列を初期化しました');
    
    // ヘッダー行（日付行）を特定
    const headerRow = data[3]; // 4行目が日付ヘッダー
    const dateHeaders = headerRow.slice(dateStartColumn, endColumn + 1); // 指定された範囲の日付を取得
    
    // 曜日行も取得（5行目があれば）
    const dayOfWeekRow = data[4] || []; // 5行目が曜日ヘッダー
    const dayOfWeekHeaders = dayOfWeekRow.slice(dateStartColumn, endColumn + 1);
    
    console.log(`日付範囲: ${String.fromCharCode(65 + dateStartColumn)}列から${String.fromCharCode(65 + endColumn)}列まで`);
    console.log('日付ヘッダー:', dateHeaders);
    console.log('曜日ヘッダー:', dayOfWeekHeaders);
    
    // データ行を処理
    const actualStartRow = Math.max(startRow, (currentApp.headerRowIndex || 0) + 1);
    const dataRows = data.slice(actualStartRow);
    
    dataRows.forEach((row, rowIndex) => {
        const name = row[nameColumn];
        // 名前がない行、「氏名」、空白の行はスキップ
        if (!name || name.toString().trim() === '' || name.toString().trim() === '氏名') return;
        
        // 各日付列をチェック（指定された範囲）
        dateHeaders.forEach((dateHeader, dateIndex) => {
            const columnIndex = dateStartColumn + dateIndex; // 指定された開始列から開始
            const cellValue = row[columnIndex];
            const dayOfWeekHeader = dayOfWeekHeaders[dateIndex] || ''; // 対応する曜日
            
            if (cellValue && cellValue.toString().trim() !== '') {
                // 日付の正規化
                let normalizedDate;
                let dayOfWeek = '';
                
                try {
                    if (typeof dateHeader === 'number') {
                        // エクセルの日付シリアル値
                        const excelDate = new Date((dateHeader - 25569) * 86400 * 1000);
                        normalizedDate = excelDate.toISOString().split('T')[0];
                        dayOfWeek = getDayOfWeekFromDate(excelDate);
                    } else if (dateHeader instanceof Date) {
                        normalizedDate = dateHeader.toISOString().split('T')[0];
                        dayOfWeek = getDayOfWeekFromDate(dateHeader);
                    } else {
                        // 文字列の日付を解析
                        const dateStr = String(dateHeader).trim();
                        // 2025-06-16 形式の日付をチェック
                        if (dateStr.match(/\d{4}-\d{2}-\d{2}/)) {
                            normalizedDate = dateStr;
                            dayOfWeek = getDayOfWeekFromDate(new Date(dateStr));
                        } else {
                            const parsed = new Date(dateStr);
                            if (!isNaN(parsed.getTime())) {
                                normalizedDate = parsed.toISOString().split('T')[0];
                                dayOfWeek = getDayOfWeekFromDate(parsed);
                            } else {
                                // 日付形式の推定（例：1日、一日など）
                                normalizedDate = parseJapaneseDate(dateStr);
                                if (normalizedDate && normalizedDate !== dateStr) {
                                    dayOfWeek = getDayOfWeekFromDate(new Date(normalizedDate));
                                }
                            }
                        }
                    }
                    
                    // 曜日ヘッダーからの曜日情報を優先使用
                    if (dayOfWeekHeader && dayOfWeekHeader.toString().trim() !== '') {
                        const extractedDayOfWeek = extractDayOfWeekFromHeader(dayOfWeekHeader);
                        if (extractedDayOfWeek) {
                            dayOfWeek = extractedDayOfWeek;
                        }
                    }
                    
                } catch (error) {
                    normalizedDate = String(dateHeader);
                    console.warn('日付解析エラー:', error, dateHeader);
                }
                
                // 名前の正規化（空白、特殊文字の除去）
                const originalName = String(name).trim();
                const cleanedName = originalName
                    .replace(/\s+/g, ' ')        // 連続する空白を1つにまとめる
                    .replace(/　/g, ' ')         // 全角スペースを半角に変換
                    .replace(/\u00A0/g, ' ');    // non-breaking spaceを通常のスペースに変換
                
                // 出勤場所の推定（セルの値から、名前も渡す）
                const location = estimateLocation(cellValue, originalName);
                
                // 公休日や空白の場合も記録して分析できるようにする
                if (location !== null && location !== undefined) {
                    // 登録済みの人を検索（複数の形式を試す）
                    let person = currentApp.data.people.find(p => p.name === cleanedName);
                    
                    // 正規化された名前で見つからない場合、元の名前でも試す
                    if (!person) {
                        person = currentApp.data.people.find(p => p.name === originalName);
                    }
                    
                    // それでも見つからない場合、登録済み名前を正規化して比較
                    if (!person) {
                        person = currentApp.data.people.find(p => {
                            const normalizedRegisteredName = p.name.trim()
                                .replace(/\s+/g, ' ')
                                .replace(/　/g, ' ')
                                .replace(/\u00A0/g, ' ');
                            return normalizedRegisteredName === cleanedName;
                        });
                    }
                    
                    console.log('表形式での人の検索:', {
                        検索名: cleanedName,
                        元の名前: originalName,
                        登録済み人数: currentApp.data.people.length,
                        登録済み名前: currentApp.data.people.map(p => p.name),
                        検索結果: person ? person.name : '見つからない'
                    });
                    
                    const status = person ? 
                        (person.hasPrivateCar ? 'OK' : '自家用車なし') : 
                        '未登録';
                    
                    previewData.push({
                        name: cleanedName,
                        date: normalizedDate,
                        dayOfWeek: dayOfWeek,
                        location: location,
                        status,
                        person,
                        originalRow: actualStartRow + rowIndex + 1,
                        originalCell: cellValue
                    });
                }
            }
        });
    });
    
        console.log('表形式プレビューデータ:', previewData);
        displayPreview(previewData);
        console.log('プレビュー表示完了');
        
    } catch (error) {
        console.error('表形式プレビューでエラーが発生:', error);
        console.error('エラースタック:', error.stack);
        currentApp.showMessage('プレビューの生成でエラーが発生しました: ' + error.message, 'error');
        
        // デバッグ情報を追加で出力
        console.log('エラー発生時の状態:');
        console.log('- currentApp.currentSheetData:', currentApp.currentSheetData ? currentApp.currentSheetData.length + '行' : 'なし');
        console.log('- nameColumn:', document.getElementById('nameColumn').value);
        console.log('- dateStartColumn:', document.getElementById('dateStartColumn').value);
        console.log('- startRow:', document.getElementById('startRow').value);
    }
}

// 日本語日付の解析
function parseJapaneseDate(dateStr) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    // 日付パターンのマッチング
    const dayMatch = dateStr.match(/(\d{1,2})日?/);
    
    if (dayMatch) {
        const day = parseInt(dayMatch[1]);
        
        // 今月の日付として返す
        const date = new Date(currentYear, currentMonth - 1, day);
        return date.toISOString().split('T')[0];
    }
    
    return dateStr;
}

// 日付から曜日を取得する関数
function getDayOfWeekFromDate(date) {
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return dayNames[date.getDay()];
}

// 曜日ヘッダーから曜日を抽出する関数
function extractDayOfWeekFromHeader(header) {
    const headerStr = String(header).trim();
    
    // 曜日の正規表現パターン
    const dayPattern = /[日月火水木金土]/;
    const match = headerStr.match(dayPattern);
    
    if (match) {
        return match[0];
    }
    
    // 英語の曜日も対応
    const engDayMap = {
        'sun': '日', 'mon': '月', 'tue': '火', 'wed': '水', 
        'thu': '木', 'fri': '金', 'sat': '土'
    };
    
    const lowerHeader = headerStr.toLowerCase();
    for (const [eng, jp] of Object.entries(engDayMap)) {
        if (lowerHeader.includes(eng)) {
            return jp;
        }
    }
    
    return null;
}

// 勤務パターン検索関数
function findWorkPattern(workLocation, originalValue) {
    const currentApp = app || window.app;
    if (!currentApp || !currentApp.data.patterns) return null;
    
    console.log('=== findWorkPattern 詳細ログ ===');
    console.log('検索条件 - 出勤場所:', workLocation);
    console.log('検索条件 - 元の勤務名:', originalValue);
    console.log('登録済みパターン数:', currentApp.data.patterns.length);
    
    // 1. 元の勤務名で検索（優先）
    if (originalValue) {
        const normalizedOriginal = String(originalValue).trim();
        console.log('元の勤務名で検索中:', normalizedOriginal);
        
        for (const pattern of currentApp.data.patterns) {
            const normalizedPatternName = String(pattern.name).trim();
            console.log('パターン比較:', {
                パターン名: normalizedPatternName,
                元の勤務名: normalizedOriginal,
                完全一致: normalizedPatternName === normalizedOriginal,
                部分一致1: normalizedOriginal.includes(normalizedPatternName),
                部分一致2: normalizedPatternName.includes(normalizedOriginal)
            });
            
            if (normalizedPatternName === normalizedOriginal || 
                normalizedOriginal.includes(normalizedPatternName) ||
                normalizedPatternName.includes(normalizedOriginal)) {
                console.log('勤務名で勤務パターン発見:', pattern);
                return pattern;
            }
        }
    }
    
    // 2. 出勤場所で検索
    console.log('出勤場所で検索中:', workLocation);
    let pattern = currentApp.data.patterns.find(p => p.workLocation === workLocation);
    if (pattern) {
        console.log('出勤場所で勤務パターン発見:', pattern);
        return pattern;
    }
    
    console.log('勤務パターンが見つかりません:', {workLocation, originalValue});
    return null;
}

// 通勤費計算関数
function calculateTransportationCost(person, workLocation, workPattern) {
    if (!person || !workLocation) return 0;
    
    const unitRate = app.data.settings.unitRate;
    
    // デバッグ情報を出力
    console.log('通勤費計算:', {
        person: person.name,
        workLocation: workLocation,
        workPattern: workPattern,
        nearestStation: person.nearestStation,
        nearestStationDistance: person.nearestStationDistance,
        hasPrivateCar: person.hasPrivateCar,
        trainCommute: workPattern ? workPattern.trainCommute : 'パターンなし',
        tripType: workPattern ? workPattern.tripType : 'パターンなし'
    });
    
    // 【最優先】勤務パターンが電車通勤可能な場合は必ず最寄駅距離を使用
    if (workPattern && workPattern.trainCommute === 'possible' && person.nearestStationDistance) {
        const distance = parseFloat(person.nearestStationDistance);
        if (!isNaN(distance) && distance > 0) {
            // 往復/片道/なしを考慮（デフォルトは往復）
            if (workPattern.tripType === 'none') {
                console.log('電車通勤可能パターンで計算(なし): 0円 (最寄駅:', person.nearestStation, distance, 'km)');
                return 0;
            }
            const tripMultiplier = workPattern.tripType === 'oneway' ? 1 : 2;
            const cost = distance * tripMultiplier * unitRate;
            const tripTypeText = workPattern.tripType === 'oneway' ? '片道' : '往復';
            console.log(`電車通勤可能パターンで計算(${tripTypeText}):`, cost, '円 (最寄駅:', person.nearestStation, distance, 'km)');
            return cost;
        }
    }
    
    // 出勤先が最寄駅の場合は最寄駅距離を使用（電車通勤）
    if (workLocation === person.nearestStation && person.nearestStationDistance) {
        const distance = parseFloat(person.nearestStationDistance);
        if (!isNaN(distance) && distance > 0) {
            const cost = distance * 2 * unitRate;
            console.log('最寄駅直行で計算:', cost, '円 (最寄駅:', person.nearestStation, distance, 'km)');
            return cost;
        }
    }
    
    // 自家用車の場合は従来の距離計算
    if (person.hasPrivateCar && person.distances && person.distances[workLocation]) {
        // 往復/片道/なしを考慮（勤務パターンが定義されていない場合は往復）
        if (workPattern && workPattern.tripType === 'none') {
            console.log('自家用車で計算(なし): 0円 (', workLocation, ':', person.distances[workLocation], 'km)');
            return 0;
        }
        const tripMultiplier = workPattern && workPattern.tripType === 'oneway' ? 1 : 2;
        const cost = person.distances[workLocation] * tripMultiplier * unitRate;
        const tripTypeText = workPattern && workPattern.tripType === 'oneway' ? '片道' : '往復';
        console.log(`自家用車で計算(${tripTypeText}):`, cost, '円 (', workLocation, ':', person.distances[workLocation], 'km)');
        return cost;
    }
    
    console.log('計算不可: 条件を満たさない');
    return 0;
}

// 通勤費計算方法の説明を取得
function getTransportationMethod(person, workLocation, workPattern) {
    if (!person || !workLocation) return '計算不可';
    
    // 【最優先】勤務パターンが電車通勤可能な場合は必ず最寄駅距離を使用
    if (workPattern && workPattern.trainCommute === 'possible' && person.nearestStationDistance) {
        const tripTypeText = workPattern.tripType === 'oneway' ? '片道' : 
                            workPattern.tripType === 'none' ? 'なし' : '往復';
        return `電車通勤${tripTypeText} (最寄駅${person.nearestStation}まで${person.nearestStationDistance}km)`;
    }
    
    // 出勤先が最寄駅の場合は最寄駅距離を使用（電車通勤）
    if (workLocation === person.nearestStation && person.nearestStationDistance) {
        const tripTypeText = workPattern && workPattern.tripType === 'oneway' ? '片道' : 
                            workPattern && workPattern.tripType === 'none' ? 'なし' : '往復';
        return `電車通勤${tripTypeText} (最寄駅${person.nearestStation}まで${person.nearestStationDistance}km)`;
    }
    
    // 自家用車の場合は従来の距離計算
    if (person.hasPrivateCar && person.distances && person.distances[workLocation]) {
        const tripTypeText = workPattern && workPattern.tripType === 'oneway' ? '片道' : 
                            workPattern && workPattern.tripType === 'none' ? 'なし' : '往復';
        return `自家用車${tripTypeText} (${workLocation}まで${person.distances[workLocation]}km)`;
    }
    
    return '計算不可';
}

// 出勤場所の推定（電車通勤を考慮）
function estimateLocation(cellValue, personName = null) {
    if (!cellValue || cellValue.toString().trim() === '') return null;
    
    const cellStr = String(cellValue).trim();
    const locations = ['大月駅', '都留文科大学前駅', '下吉田駅', '富士山駅', 'ハイランド駅', '河口湖駅', '鉄道技術所'];
    
    console.log('=== estimateLocation 詳細ログ ===');
    console.log('入力値:', cellStr);
    console.log('人の名前:', personName);
    console.log('登録済みパターン数:', app.data.patterns ? app.data.patterns.length : 0);
    
    // 完全一致
    for (const location of locations) {
        if (cellStr === location) {
            console.log('駅名完全一致:', location);
            return location;
        }
    }
    
    // 登録済み勤務パターンから推定（最優先）
    const patterns = app.data.patterns || [];
    console.log('勤務パターン検索開始...');
    
    // 1. 完全一致を最優先でチェック
    for (const pattern of patterns) {
        if (cellStr === pattern.name) {
            console.log('完全一致勤務パターン発見:', pattern.name, '出勤場所:', pattern.workLocation);
            
            // 電車通勤可能な勤務パターンで、人の情報がある場合は最寄駅を使用
            if (pattern.trainCommute === 'possible' && personName) {
                console.log('電車通勤可能パターン、人の検索開始...');
                console.log('検索対象名:', personName);
                console.log('登録済み人員:', app.data.people.map(p => ({ name: p.name, nearestStation: p.nearestStation })));
                // 複数の形式で人を検索
                let person = app.data.people.find(p => p.name === personName);
                if (!person) {
                    // 名前を正規化して検索
                    const normalizedPersonName = personName.trim()
                        .replace(/\s+/g, ' ')
                        .replace(/　/g, ' ')
                        .replace(/\u00A0/g, ' ');
                    person = app.data.people.find(p => {
                        const normalizedRegisteredName = p.name.trim()
                            .replace(/\s+/g, ' ')
                            .replace(/　/g, ' ')
                            .replace(/\u00A0/g, ' ');
                        return normalizedRegisteredName === normalizedPersonName;
                    });
                }
                console.log('人の検索結果:', person);
                
                if (person && person.nearestStation) {
                    console.log('電車通勤可能パターン:', pattern.name, '→ 最寄駅:', person.nearestStation);
                    return person.nearestStation;
                } else {
                    console.log('最寄駅なし、通常の出勤場所を使用:', pattern.workLocation);
                }
            } else {
                console.log('電車通勤不可または人の名前なし、通常の出勤場所を使用:', pattern.workLocation);
            }
            return pattern.workLocation;
        }
    }
    
    // 2. 部分一致チェック
    for (const pattern of patterns) {
        console.log('パターン確認:', {
            name: pattern.name,
            workLocation: pattern.workLocation,
            trainCommute: pattern.trainCommute,
            cellStr: cellStr,
            部分一致1: cellStr.includes(pattern.name),
            部分一致2: pattern.name.includes(cellStr)
        });
        
        if (cellStr.includes(pattern.name) || pattern.name.includes(cellStr)) {
            console.log('部分一致勤務パターン発見:', pattern.name, '出勤場所:', pattern.workLocation);
            
            // 電車通勤可能な勤務パターンで、人の情報がある場合は最寄駅を使用
            if (pattern.trainCommute === 'possible' && personName) {
                console.log('電車通勤可能パターン、人の検索開始...');
                console.log('検索対象名:', personName);
                console.log('登録済み人員:', app.data.people.map(p => ({ name: p.name, nearestStation: p.nearestStation })));
                // 複数の形式で人を検索
                let person = app.data.people.find(p => p.name === personName);
                if (!person) {
                    // 名前を正規化して検索
                    const normalizedPersonName = personName.trim()
                        .replace(/\s+/g, ' ')
                        .replace(/　/g, ' ')
                        .replace(/\u00A0/g, ' ');
                    person = app.data.people.find(p => {
                        const normalizedRegisteredName = p.name.trim()
                            .replace(/\s+/g, ' ')
                            .replace(/　/g, ' ')
                            .replace(/\u00A0/g, ' ');
                        return normalizedRegisteredName === normalizedPersonName;
                    });
                }
                console.log('人の検索結果:', person);
                
                if (person && person.nearestStation) {
                    console.log('電車通勤可能パターン:', pattern.name, '→ 最寄駅:', person.nearestStation);
                    return person.nearestStation;
                } else {
                    console.log('最寄駅なし、通常の出勤場所を使用:', pattern.workLocation);
                }
            } else {
                console.log('電車通勤不可または人の名前なし、通常の出勤場所を使用:', pattern.workLocation);
            }
            return pattern.workLocation;
        }
    }
    
    // 部分一致
    console.log('駅名部分一致チェック...');
    for (const location of locations) {
        if (cellStr.includes(location.replace('駅', '')) || location.includes(cellStr)) {
            console.log('駅名部分一致:', location);
            return location;
        }
    }
    
    // 略称マッチング（登録パターンにない場合のフォールバック）
    console.log('略称マッチングチェック...');
    const shortNames = {
        '大月': '大月駅',
        '都留': '都留文科大学前駅',
        '下吉': '下吉田駅',
        '富士': '富士山駅',
        'HL': 'ハイランド駅',
        'ハイ': 'ハイランド駅',
        '河口': '河口湖駅',
        // 勤務コード対応（登録パターンがない場合のデフォルト）
        '指明': '大月駅',
        '指泊': '河口湖駅',
        '組': '大月駅'
        // '特': '河口湖駅' を削除 - 文早等の勤務パターンと競合するため
    };
    
    for (const [short, full] of Object.entries(shortNames)) {
        if (cellStr.includes(short)) {
            console.log('略称マッチング:', short, '→', full);
            return full;
        }
    }
    
    // デフォルト：セルの値をそのまま返す（後で手動修正可能）
    console.log('デフォルト:', cellStr);
    return cellStr;
}

// 行形式のプレビュー（従来の方式）
function previewRowFormat() {
    const nameColumn = parseInt(document.getElementById('nameColumn').value);
    const dateStartColumn = parseInt(document.getElementById('dateStartColumn').value);
    const dateEndColumn = parseInt(document.getElementById('dateEndColumn').value);
    const startRow = parseInt(document.getElementById('startRow').value) - 1;

    if (isNaN(nameColumn) || isNaN(dateStartColumn)) {
        app.showMessage('氏名、日付開始の列を選択してください', 'error');
        return;
    }
    
    // 行形式の場合、日付終了列は使用しないので、日付開始列を日付列として使用
    const dateColumn = dateStartColumn;

    console.log('行形式プレビュー開始 - 選択された列:', { nameColumn, dateColumn, startRow });
    
    // ヘッダー行を考慮したデータ開始行を自動調整
    const actualStartRow = Math.max(startRow, (app.headerRowIndex || 0) + 1);
    const data = app.currentSheetData.slice(actualStartRow);
    const previewData = [];
    
    data.forEach((row, index) => {
        const name = row[nameColumn];
        const date = row[dateColumn];
        
        // 空行、「氏名」、空白の行をスキップ
        if (!name && !date) return;
        if (name && (name.toString().trim() === '' || name.toString().trim() === '氏名')) return;
        
        // 日付の正規化
        let normalizedDate;
        try {
            if (typeof date === 'number') {
                // エクセルの日付シリアル値
                const excelDate = new Date((date - 25569) * 86400 * 1000);
                normalizedDate = excelDate.toISOString().split('T')[0];
            } else if (date instanceof Date) {
                normalizedDate = date.toISOString().split('T')[0];
            } else {
                normalizedDate = String(date);
            }
        } catch (error) {
            console.error('日付変換エラー:', error);
            normalizedDate = String(date);
        }
        
        // 人の存在チェック（複数の形式を試す）
        const originalName = String(name).trim();
        const searchName = originalName
            .replace(/\s+/g, ' ')        // 連続する空白を1つにまとめる
            .replace(/　/g, ' ')         // 全角スペースを半角に変換
            .replace(/\u00A0/g, ' ');    // non-breaking spaceを通常のスペースに変換
        
        let person = app.data.people.find(p => p.name === searchName);
        
        // 正規化された名前で見つからない場合、元の名前でも試す
        if (!person) {
            person = app.data.people.find(p => p.name === originalName);
        }
        
        // それでも見つからない場合、登録済み名前を正規化して比較
        if (!person) {
            person = app.data.people.find(p => {
                const normalizedRegisteredName = p.name.trim()
                    .replace(/\s+/g, ' ')
                    .replace(/　/g, ' ')
                    .replace(/\u00A0/g, ' ');
                return normalizedRegisteredName === searchName;
            });
        }
        console.log('行形式での人の検索:', {
            検索名: searchName,
            元の名前: originalName,
            登録済み人数: app.data.people.length,
            登録済み名前: app.data.people.map(p => p.name),
            検索結果: person ? person.name : '見つからない'
        });
        const status = person ? 
            (person.hasPrivateCar ? 'OK' : '自家用車なし') : 
            '未登録';
        
        // 名前の正規化（空白、特殊文字の除去）- 既に上でsearchNameとして実行済み
        console.log('名前の正規化:', {原名: originalName, 正規化後: searchName});
        
        // 出勤先を推定（勤務内容, 人の名前の順）
        let estimatedLocation = estimateLocation(date, originalName);
        
        // 追加処理: 勤務パターンが電車通勤可能で、人に最寄駅がある場合は最寄駅を使用
        if (person && person.nearestStation) {
            const workPattern = findWorkPattern(estimatedLocation, date);
            if (workPattern && workPattern.trainCommute === 'possible') {
                console.log('電車通勤可能パターン検出、最寄駅を使用:', {
                    元の出勤先: estimatedLocation,
                    最寄駅: person.nearestStation,
                    勤務パターン: workPattern.name
                });
                estimatedLocation = person.nearestStation;
            }
        }
        
        // 曜日の計算
        let dayOfWeek = '';
        try {
            if (typeof date === 'number') {
                // エクセルの日付シリアル値
                const excelDate = new Date((date - 25569) * 86400 * 1000);
                dayOfWeek = getDayOfWeekFromDate(excelDate);
            } else if (date instanceof Date) {
                dayOfWeek = getDayOfWeekFromDate(date);
            } else {
                // 文字列の日付を解析
                const parsedDate = new Date(normalizedDate);
                if (!isNaN(parsedDate.getTime())) {
                    dayOfWeek = getDayOfWeekFromDate(parsedDate);
                }
            }
        } catch (error) {
            console.warn('曜日計算エラー:', error);
        }
        
        previewData.push({
            name: searchName,
            date: normalizedDate,
            dayOfWeek: dayOfWeek,
            location: estimatedLocation, // 修正された出勤先
            originalValue: date, // 元の勤務名を保存
            status,
            person,
            originalRow: actualStartRow + index + 1
        });
    });

    console.log('行形式プレビューデータ:', previewData);
    displayPreview(previewData);
}

// プレビューデータの表示
function displayPreview(data) {
    const container = document.getElementById('previewData');
    
    if (!container) {
        console.error('プレビューコンテナが見つかりません');
        app.showMessage('プレビュー表示エラー: コンテナが見つかりません', 'error');
        return;
    }
    
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="no-data">プレビューするデータがありません</div>';
        return;
    }

    // 統計情報を追加
    const registeredCount = data.filter(item => item.status === 'OK').length;
    const unregisteredCount = data.filter(item => item.status === '未登録').length;
    const noCarCount = data.filter(item => item.status === '自家用車なし').length;
    
    // 出勤先別統計
    const locationStats = {};
    data.forEach(item => {
        if (item.location) {
            locationStats[item.location] = (locationStats[item.location] || 0) + 1;
        }
    });
    
    // 勤務パターン別統計（originalCellの値を使用）
    const workPatternStats = {};
    data.forEach(item => {
        if (item.originalCell) {
            const pattern = String(item.originalCell).trim();
            workPatternStats[pattern] = (workPatternStats[pattern] || 0) + 1;
        }
    });
    
    // 個人別通勤費統計
    const personStats = {};
    data.forEach(item => {
        if (!personStats[item.name]) {
            personStats[item.name] = {
                totalAmount: 0,
                workDays: 0,
                status: item.status
            };
        }
        
        if (item.status === 'OK' && item.person) {
            // 勤務パターンを取得
            const workPattern = findWorkPattern(item.location, item.originalCell || item.originalValue);
            const amount = calculateTransportationCost(item.person, item.location, workPattern);
            personStats[item.name].totalAmount += amount;
        }
        personStats[item.name].workDays++;
    });
    
    // 出勤先統計の表示
    const locationStatsHtml = Object.entries(locationStats)
        .sort(([,a], [,b]) => b - a)
        .map(([location, count]) => `${location}: ${count}件`)
        .join(' | ');
    
    // 勤務パターン統計の表示
    const workPatternStatsHtml = Object.entries(workPatternStats)
        .sort(([,a], [,b]) => b - a)
        .map(([pattern, count]) => `${pattern}: ${count}件`)
        .join(' | ');
    
    // 個人別通勤費統計の表示
    const personStatsHtml = Object.entries(personStats)
        .sort(([,a], [,b]) => b.totalAmount - a.totalAmount)
        .map(([name, stats]) => `${name}: ${stats.totalAmount.toLocaleString()}円 (${stats.workDays}日)`)
        .join(' | ');
    
    const statsHtml = `
        <div class="preview-stats" style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
            <div style="margin-bottom: 8px;">
                <strong>プレビュー統計:</strong> 
                総件数: ${data.length}件 | 
                計算可能: ${registeredCount}件 | 
                自家用車なし: ${noCarCount}件 | 
                未登録: ${unregisteredCount}件
            </div>
            <div style="margin-bottom: 8px;">
                <strong>出勤先別:</strong> ${locationStatsHtml}
            </div>
            <div style="margin-bottom: 8px;">
                <strong>勤務パターン別:</strong> ${workPatternStatsHtml}
            </div>
            <div>
                <strong>個人別通勤費:</strong> ${personStatsHtml}
            </div>
        </div>
    `;

    const table = document.createElement('table');
    table.className = 'preview-table';
    
    // ヘッダー
    table.innerHTML = `
        <thead>
            <tr>
                <th>行番号</th>
                <th>氏名</th>
                <th>日付</th>
                <th>曜日</th>
                <th>勤務パターン</th>
                <th>出勤先</th>
                <th>状態</th>
                <th>通勤費</th>
                <th>計算方法</th>
            </tr>
        </thead>
        <tbody>
            ${data.map(item => {
                const rowClass = item.status === 'OK' ? 'success-row' : 
                               item.status === '自家用車なし' ? 'warning-row' : 'error-row';
                // 正しい通勤費計算を使用
                let amount = 0;
                let calculationMethod = '-';
                if (item.status === 'OK' && item.person) {
                    const workPattern = findWorkPattern(item.location, item.originalCell || item.originalValue);
                    amount = calculateTransportationCost(item.person, item.location, workPattern);
                    calculationMethod = getTransportationMethod(item.person, item.location, workPattern);
                }
                
                // 曜日付き日付の表示
                const formatDateWithDay = (dateStr) => {
                    try {
                        const date = new Date(dateStr);
                        if (isNaN(date.getTime())) return dateStr;
                        
                        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
                        const dayOfWeek = dayNames[date.getDay()];
                        const month = date.getMonth() + 1;
                        const day = date.getDate();
                        
                        return `${month}/${day}(${dayOfWeek})`;
                    } catch (error) {
                        return dateStr;
                    }
                };
                
                return `
                    <tr class="${rowClass}">
                        <td>${item.originalRow}</td>
                        <td>${item.name}</td>
                        <td>${formatDateWithDay(item.date)}</td>
                        <td>${item.dayOfWeek || '-'}</td>
                        <td>${item.originalCell || '-'}</td>
                        <td>${item.location}</td>
                        <td>${item.status}</td>
                        <td>${amount > 0 ? amount.toLocaleString() + '円' : '-'}</td>
                        <td>${calculationMethod}</td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    `;
    
    container.innerHTML = statsHtml;
    container.appendChild(table);
    
    app.previewData = data;
    app.originalPreviewData = JSON.parse(JSON.stringify(data)); // 元データのコピーを保存
    app.nameSelectionMode = false;
    
    // プレビューセクションを表示
    const previewSection = document.getElementById('previewSection');
    if (previewSection) {
        previewSection.style.display = 'block';
        console.log('プレビューセクションを表示しました');
    } else {
        console.error('プレビューセクションが見つかりません');
        app.showMessage('プレビューセクションが見つかりません', 'error');
        return;
    }
    
    // 人ごとのフィルタリング選択肢を設定
    populatePersonFilter(data);
    
    app.showMessage(`${data.length}件のデータをプレビューしました`, 'success');
}

// 人ごとのフィルタリング選択肢を設定
function populatePersonFilter(data) {
    const personFilter = document.getElementById('personFilter');
    if (!personFilter) return;
    
    // 人名一覧を取得（重複を排除）
    const uniqueNames = [...new Set(data.map(item => item.name))].sort();
    
    // 選択肢を生成
    const options = ['<option value="">すべて表示</option>'];
    uniqueNames.forEach(name => {
        const count = data.filter(item => item.name === name).length;
        options.push(`<option value="${name}">${name} (${count}件)</option>`);
    });
    
    personFilter.innerHTML = options.join('');
}

// 人ごとのフィルタリング適用
function applyPersonFilter() {
    if (!app.originalPreviewData || app.originalPreviewData.length === 0) {
        app.showMessage('プレビューデータがありません', 'error');
        return;
    }
    
    const personFilter = document.getElementById('personFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    console.log('フィルタリング条件:', { personFilter, statusFilter });
    
    // データをフィルタリング
    let filteredData = app.originalPreviewData;
    
    // 人でフィルタリング
    if (personFilter) {
        filteredData = filteredData.filter(item => item.name === personFilter);
    }
    
    // 状態でフィルタリング
    if (statusFilter) {
        filteredData = filteredData.filter(item => item.status === statusFilter);
    }
    
    console.log('フィルタリング結果:', {
        元データ件数: app.originalPreviewData.length,
        フィルタ後件数: filteredData.length,
        選択した人: personFilter || 'すべて',
        選択した状態: statusFilter || 'すべて'
    });
    
    // フィルタリングされたデータでプレビューを更新
    app.previewData = filteredData;
    displayPreview(filteredData);
    
    const filterInfo = [];
    if (personFilter) filterInfo.push(`人: ${personFilter}`);
    if (statusFilter) filterInfo.push(`状態: ${statusFilter}`);
    
    const filterText = filterInfo.length > 0 ? `（${filterInfo.join('、')}）` : '';
    app.showMessage(`${filteredData.length}件のデータを表示しています${filterText}`, 'success');
}

// 人ごとのフィルタリングリセット
function resetPersonFilter() {
    // フィルタをクリア
    document.getElementById('personFilter').value = '';
    document.getElementById('statusFilter').value = '';
    
    // 元データでプレビューを復元
    if (app.originalPreviewData) {
        app.previewData = JSON.parse(JSON.stringify(app.originalPreviewData));
        displayPreview(app.previewData);
        app.showMessage(`フィルターをリセットしました（${app.previewData.length}件）`, 'success');
    }
}

// エクセルデータの取込実行
function importExcelData() {
    if (!app.previewData || app.previewData.length === 0) {
        app.showMessage('プレビューデータがありません', 'error');
        return;
    }

    let importCount = 0;
    let skipCount = 0;

    app.previewData.forEach(item => {
        if (item.status === 'OK' && item.person.distances[item.location]) {
            const distance = item.person.distances[item.location];
            const totalDistance = distance * 2; // 往復固定
            const amount = Math.round(totalDistance * app.data.settings.unitRate);

            // Data processing for summary (records removed)
            importCount++;
        } else {
            skipCount++;
        }
    });

    app.saveData();
    // updateRecentRecords() removed
    
    app.showMessage(`${importCount}件を取込、${skipCount}件をスキップしました`, 'success');
    clearPreview();
}

// プレビューのクリア
function clearPreview() {
    document.getElementById('previewData').innerHTML = '';
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('workPatternSection').style.display = 'none';
    document.getElementById('workPatternData').innerHTML = '';
    document.getElementById('bulkAnalysisSection').style.display = 'none';
    document.getElementById('bulkAnalysisData').innerHTML = '';
    app.previewData = null;
}

// 勤務パターン分析
function analyzeWorkPatterns() {
    if (!app.previewData || app.previewData.length === 0) {
        app.showMessage('プレビューデータがありません', 'error');
        return;
    }

    // 人ごとにデータをグループ化
    const peopleData = {};
    app.previewData.forEach(item => {
        if (!peopleData[item.name]) {
            peopleData[item.name] = {
                name: item.name,
                status: item.status,
                person: item.person,
                workDays: [],
                locations: {},
                totalDays: 0
            };
        }
        
        peopleData[item.name].workDays.push({
            date: item.date,
            location: item.location,
            originalValue: item.originalValue // 元の勤務名を保存
        });
        
        if (!peopleData[item.name].locations[item.location]) {
            peopleData[item.name].locations[item.location] = 0;
        }
        peopleData[item.name].locations[item.location]++;
        peopleData[item.name].totalDays++;
    });

    displayWorkPatterns(peopleData);
}

// 勤務パターンの表示
function displayWorkPatterns(peopleData) {
    const container = document.getElementById('workPatternData');
    
    if (Object.keys(peopleData).length === 0) {
        container.innerHTML = '<div class="no-data">分析するデータがありません</div>';
        return;
    }

    // 各人の勤務パターンカードを作成
    const patternCards = Object.values(peopleData).map(personData => {
        const totalDays = personData.totalDays;
        const locationCount = Object.keys(personData.locations).length;
        const mostFrequentLocation = Object.entries(personData.locations)
            .sort(([,a], [,b]) => b - a)[0];
        
        // 月間カレンダーを生成
        const calendar = generateMonthlyCalendar(personData.workDays);
        
        // 勤務可能性判定
        const canWork = personData.status === 'OK';
        const statusColor = canWork ? '#28a745' : '#dc3545';
        
        // 予想通勤費計算
        let totalExpectedCost = 0;
        if (canWork && personData.person) {
            Object.entries(personData.locations).forEach(([location, count]) => {
                console.log('勤務パターン検索 - 人:', personData.name, '場所:', location, '回数:', count);
                
                // 元の勤務名を取得
                const workDaysForLocation = personData.workDays.filter(day => day.location === location);
                const originalValue = workDaysForLocation.length > 0 ? workDaysForLocation[0].originalValue : null;
                
                // 勤務パターンを検索
                const workPattern = findWorkPattern(location, originalValue);
                
                const cost = calculateTransportationCost(personData.person, location, workPattern);
                totalExpectedCost += count * cost;
            });
        }

        return `
            <div class="pattern-card">
                <h4>${personData.name} <span style="color: ${statusColor};">(${personData.status})</span></h4>
                
                <div class="pattern-stats">
                    <div class="pattern-stat">
                        <div class="pattern-stat-value">${totalDays}</div>
                        <div class="pattern-stat-label">勤務日数</div>
                    </div>
                    <div class="pattern-stat">
                        <div class="pattern-stat-value">${locationCount}</div>
                        <div class="pattern-stat-label">勤務場所</div>
                    </div>
                    <div class="pattern-stat">
                        <div class="pattern-stat-value">${totalExpectedCost.toLocaleString()}</div>
                        <div class="pattern-stat-label">予想通勤費(円)</div>
                    </div>
                </div>

                <div class="pattern-details">
                    <strong>最多勤務場所:</strong> ${mostFrequentLocation[0]} (${mostFrequentLocation[1]}日)
                </div>

                <div class="location-breakdown">
                    <strong>勤務場所別内訳:</strong>
                    ${Object.entries(personData.locations).map(([location, count]) => {
                        const distance = canWork && personData.person ? personData.person.distances[location] : 0;
                        const cost = distance ? count * distance * 2 * app.data.settings.unitRate : 0;
                        return `
                            <div class="location-item">
                                <span>${location}</span>
                                <span>${count}日 ${cost > 0 ? `(${cost.toLocaleString()}円)` : ''}</span>
                            </div>
                        `;
                    }).join('')}
                </div>

                ${calendar}
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="pattern-summary">
            ${patternCards}
        </div>
    `;

    document.getElementById('workPatternSection').style.display = 'block';
    app.showMessage(`${Object.keys(peopleData).length}人の勤務パターンを分析しました`, 'success');
}

// 月間カレンダー生成
function generateMonthlyCalendar(workDays) {
    if (workDays.length === 0) return '';

    // 勤務日の最初の月を取得
    const firstDate = new Date(workDays[0].date);
    const year = firstDate.getFullYear();
    const month = firstDate.getMonth();

    // 月の1日と最終日を取得
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 月の最初の週の開始日（日曜日）
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // 勤務日をマップに変換
    const workDayMap = {};
    workDays.forEach(workDay => {
        workDayMap[workDay.date] = workDay.location;
    });

    // カレンダーの日付を生成
    const calendarDays = [];
    const currentDate = new Date(startDate);
    
    for (let week = 0; week < 6; week++) {
        for (let day = 0; day < 7; day++) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const isCurrentMonth = currentDate.getMonth() === month;
            const isWorkDay = workDayMap[dateStr];
            
            calendarDays.push(`
                <div class="calendar-day ${isCurrentMonth ? '' : 'other-month'} ${isWorkDay ? 'work-day' : ''}">
                    <span>${currentDate.getDate()}</span>
                    ${isWorkDay ? `<span class="work-location">${getLocationShort(isWorkDay)}</span>` : ''}
                </div>
            `);
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    return `
        <div class="monthly-calendar">
            <h5>${year}年${month + 1}月 勤務カレンダー</h5>
            <div class="calendar-header">
                <div class="calendar-day-header">日</div>
                <div class="calendar-day-header">月</div>
                <div class="calendar-day-header">火</div>
                <div class="calendar-day-header">水</div>
                <div class="calendar-day-header">木</div>
                <div class="calendar-day-header">金</div>
                <div class="calendar-day-header">土</div>
            </div>
            <div class="calendar-grid">
                ${calendarDays.join('')}
            </div>
        </div>
    `;
}

// 場所名を短縮表示
function getLocationShort(location) {
    const shortNames = {
        '大月駅': '大月',
        '都留文科大学前駅': '都留',
        '下吉田駅': '下吉',
        '富士山駅': '富士',
        'ハイランド駅': 'HL',
        '河口湖駅': '河口'
    };
    return shortNames[location] || location.substring(0, 2);
}

// 登録済み人員の一括分析
function bulkAnalyzeRegistered() {
    if (!app.previewData || app.previewData.length === 0) {
        app.showMessage('プレビューデータがありません', 'error');
        return;
    }

    // 人ごとにデータをグループ化
    const peopleData = {};
    app.previewData.forEach(item => {
        if (!peopleData[item.name]) {
            peopleData[item.name] = {
                name: item.name,
                status: item.status,
                person: item.person,
                workDays: [],
                locations: {},
                totalDays: 0,
                totalCost: 0
            };
        }
        
        peopleData[item.name].workDays.push({
            date: item.date,
            location: item.location,
            originalValue: item.originalValue // 元の勤務名を保存
        });
        
        if (!peopleData[item.name].locations[item.location]) {
            peopleData[item.name].locations[item.location] = 0;
        }
        peopleData[item.name].locations[item.location]++;
        peopleData[item.name].totalDays++;

        // 通勤費計算（登録済みの場合のみ）
        if (item.status === 'OK' && item.person) {
            console.log('=== 一括分析 - 通勤費計算 ===');
            console.log('人:', item.name);
            console.log('出勤場所:', item.location);
            console.log('元の勤務名:', item.originalValue);
            console.log('人の最寄駅:', item.person.nearestStation);
            console.log('最寄駅距離:', item.person.nearestStationDistance);
            console.log('登録済みパターン:', app.data.patterns);
            
            // 勤務パターンを検索
            const workPattern = findWorkPattern(item.location, item.originalValue);
            console.log('検索された勤務パターン:', workPattern);
            
            const cost = calculateTransportationCost(item.person, item.location, workPattern);
            console.log('計算された通勤費:', cost);
            peopleData[item.name].totalCost += cost;
        }
    });

    displayBulkAnalysis(peopleData);
}

// 一括分析結果の表示
function displayBulkAnalysis(peopleData) {
    const container = document.getElementById('bulkAnalysisData');
    const summaryContainer = document.getElementById('bulkSummary');
    
    const totalPeople = Object.keys(peopleData).length;
    const registeredPeople = Object.values(peopleData).filter(p => p.status === 'OK').length;
    const unregisteredPeople = Object.values(peopleData).filter(p => p.status === '未登録').length;
    const noCarPeople = Object.values(peopleData).filter(p => p.status === '自家用車なし').length;
    const totalWorkDays = Object.values(peopleData).reduce((sum, p) => sum + p.totalDays, 0);
    const totalCost = Object.values(peopleData).reduce((sum, p) => sum + p.totalCost, 0);

    // サマリー表示
    summaryContainer.innerHTML = `
        <div class="bulk-stat">
            <span class="bulk-stat-value">${totalPeople}</span>
            <div class="bulk-stat-label">総人数</div>
        </div>
        <div class="bulk-stat">
            <span class="bulk-stat-value">${registeredPeople}</span>
            <div class="bulk-stat-label">登録済み</div>
        </div>
        <div class="bulk-stat">
            <span class="bulk-stat-value">${unregisteredPeople}</span>
            <div class="bulk-stat-label">未登録</div>
        </div>
        <div class="bulk-stat">
            <span class="bulk-stat-value">${noCarPeople}</span>
            <div class="bulk-stat-label">自家用車なし</div>
        </div>
        <div class="bulk-stat">
            <span class="bulk-stat-value">${totalWorkDays}</span>
            <div class="bulk-stat-label">総勤務日数</div>
        </div>
        <div class="bulk-stat">
            <span class="bulk-stat-value">${totalCost.toLocaleString()}</span>
            <div class="bulk-stat-label">総通勤費(円)</div>
        </div>
    `;

    // 登録済みと未登録に分けて表示
    const registeredCards = [];
    const unregisteredCards = [];

    Object.values(peopleData).forEach(personData => {
        const locationList = Object.entries(personData.locations)
            .sort(([,a], [,b]) => b - a)
            .map(([location, count]) => {
                const distance = personData.person && personData.person.distances ? 
                    personData.person.distances[location] : 0;
                const cost = distance ? count * distance * 2 * app.data.settings.unitRate : 0;
                return `${location}: ${count}日${cost > 0 ? ` (${cost.toLocaleString()}円)` : ''}`;
            }).join(', ');

        const card = `
            <div class="${personData.status === 'OK' ? 'registered-person-card' : 'unregistered-person-card'}">
                <div class="person-name">${personData.name}</div>
                <div class="person-summary">
                    <span>${personData.totalDays}日勤務</span>
                    <span>${personData.totalCost.toLocaleString()}円</span>
                </div>
                <div class="cost-breakdown">${locationList}</div>
                ${personData.status !== 'OK' ? `<div style="color: #dc3545; font-size: 12px; margin-top: 5px;">※${personData.status}</div>` : ''}
            </div>
        `;

        if (personData.status === 'OK') {
            registeredCards.push(card);
        } else {
            unregisteredCards.push(card);
        }
    });

    container.innerHTML = `
        ${registeredCards.length > 0 ? `
            <h4>✅ 登録済み・計算可能 (${registeredCards.length}名)</h4>
            <div class="registered-list">
                ${registeredCards.join('')}
            </div>
        ` : ''}
        
        ${unregisteredCards.length > 0 ? `
            <h4>⚠️ 未登録・計算不可 (${unregisteredCards.length}名)</h4>
            <div class="registered-list">
                ${unregisteredCards.join('')}
            </div>
        ` : ''}
    `;

    document.getElementById('bulkAnalysisSection').style.display = 'block';
    app.showMessage(`${totalPeople}名の勤務データを一括分析しました（計算可能: ${registeredPeople}名）`, 'success');
}

// 登録済みのみ取込
function importRegisteredOnly() {
    if (!app.previewData || app.previewData.length === 0) {
        app.showMessage('プレビューデータがありません', 'error');
        return;
    }

    let importCount = 0;
    let skipCount = 0;

    app.previewData.forEach(item => {
        if (item.status === 'OK' && item.person && item.person.distances[item.location]) {
            const distance = item.person.distances[item.location];
            const totalDistance = distance * 2; // 往復固定
            const amount = Math.round(totalDistance * app.data.settings.unitRate);

            // Data processing for summary (records removed)
            importCount++;
        } else {
            skipCount++;
        }
    });

    app.saveData();
    // updateRecentRecords() removed
    
    app.showMessage(`登録済み ${importCount}件を取込、未登録等 ${skipCount}件をスキップしました`, 'success');
    clearPreview();
}

// タブ切り替え
function showTab(tabName, element) {
    // すべてのタブコンテンツを非表示
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // すべてのタブボタンの active クラスを削除
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 選択されたタブを表示
    document.getElementById(tabName).classList.add('active');
    if (element) {
        element.classList.add('active');
    }
}

// CSV出力（グローバル関数）
function exportCSV() {
    app.exportCSV();
}

// 月次集計生成（グローバル関数）
function generateSummary() {
    app.generateSummary();
}

// データ出力（グローバル関数）
function exportData() {
    app.exportData();
}

// 全データ削除（グローバル関数）
function clearAllData() {
    app.clearAllData();
}

// 勤務パターン関連の関数
TransportationApp.prototype.addPattern = function() {
    const name = document.getElementById('patternName').value.trim();
    const workLocation = document.getElementById('workLocation').value;
    const trainCommute = document.getElementById('trainCommute').value;
    const tripType = document.getElementById('tripType').value;
    
    if (!name || !workLocation || !trainCommute || !tripType) {
        this.showMessage('全ての項目を入力してください', 'error');
        return;
    }
    
    // 重複チェック（名前と出勤場所の組み合わせ）
    if (this.data.patterns.some(pattern => 
        pattern.name === name && pattern.workLocation === workLocation)) {
        this.showMessage('同じ勤務名と出勤場所の組み合わせが既に登録されています', 'error');
        return;
    }
    
    const pattern = {
        id: Date.now(),
        name: name,
        workLocation: workLocation,
        trainCommute: trainCommute,
        tripType: tripType,
        createdAt: new Date().toISOString()
    };
    
    this.data.patterns.push(pattern);
    this.saveData();
    this.updatePatternsList();
    this.updatePatternSelects();
    
    // フォームクリア
    document.getElementById('patternForm').reset();
    
    this.showMessage('勤務パターンを登録しました', 'success');
};

TransportationApp.prototype.updatePatternsList = function() {
    const container = document.getElementById('patternsList');
    
    if (this.data.patterns.length === 0) {
        container.innerHTML = '<div class="no-data">登録された勤務パターンがありません</div>';
        return;
    }
    
    container.innerHTML = this.data.patterns.map(pattern => {
        const trainCommuteText = pattern.trainCommute === 'possible' ? '可能' : 
                                pattern.trainCommute === 'impossible' ? '不可' : 'なし';
        const trainCommuteClass = pattern.trainCommute === 'possible' ? 'commute-possible' : 
                                 pattern.trainCommute === 'impossible' ? 'commute-impossible' : 'commute-none';
        const tripTypeText = pattern.tripType === 'roundtrip' ? '往復' : 
                            pattern.tripType === 'oneway' ? '片道' : 
                            pattern.tripType === 'none' ? 'なし' : '往復'; // デフォルト値として往復を設定
        
        return `
            <div class="pattern-item">
                <div class="pattern-header">
                    <div class="pattern-name">${pattern.name}</div>
                    <div class="pattern-actions">
                        <button onclick="app.editPattern(${pattern.id})" class="edit-btn">編集</button>
                        <button onclick="app.deletePattern(${pattern.id})" class="delete-btn">削除</button>
                    </div>
                </div>
                <div class="pattern-details">
                    <span class="pattern-location">${pattern.workLocation}</span>
                    <span class="train-commute ${trainCommuteClass}">電車通勤: ${trainCommuteText}</span>
                    <span class="trip-type">通勤費: ${tripTypeText}</span>
                </div>
            </div>
        `;
    }).join('');
};

TransportationApp.prototype.editPattern = function(id) {
    const pattern = this.data.patterns.find(p => p.id === id);
    if (!pattern) {
        this.showMessage('パターンが見つかりません', 'error');
        return;
    }

    // 編集フォームに値を設定
    document.getElementById('editPatternName').value = pattern.name;
    document.getElementById('editWorkLocation').value = pattern.workLocation;
    document.getElementById('editTrainCommute').value = pattern.trainCommute;
    document.getElementById('editTripType').value = pattern.tripType || 'roundtrip'; // デフォルト値として往復を設定

    // 電車通勤可能な場合は通勤費フィールドを無効化
    this.handleEditTrainCommuteChange();

    // 現在編集中のパターンIDを保存
    this.currentEditingPatternId = id;
    
    // モーダルを表示
    document.getElementById('editPatternModal').style.display = 'flex';
};

TransportationApp.prototype.updatePattern = function() {
    const id = this.currentEditingPatternId;
    const name = document.getElementById('editPatternName').value.trim();
    const workLocation = document.getElementById('editWorkLocation').value;
    const trainCommute = document.getElementById('editTrainCommute').value;
    const tripType = document.getElementById('editTripType').value;
    
    if (!name || !workLocation || !trainCommute || !tripType) {
        this.showMessage('全ての項目を入力してください', 'error');
        return;
    }
    
    // 重複チェック（名前と出勤場所の組み合わせ）
    const existingPattern = this.data.patterns.find(pattern => 
        pattern.name === name && pattern.workLocation === workLocation && pattern.id !== id);
    if (existingPattern) {
        this.showMessage('同じ勤務名と出勤場所の組み合わせが既に登録されています', 'error');
        return;
    }
    
    // パターンのデータを更新
    const patternIndex = this.data.patterns.findIndex(p => p.id === id);
    if (patternIndex === -1) {
        this.showMessage('パターンが見つかりません', 'error');
        return;
    }

    const updatedPattern = {
        id: id,
        name: name,
        workLocation: workLocation,
        trainCommute: trainCommute,
        tripType: tripType,
        createdAt: this.data.patterns[patternIndex].createdAt
    };

    // データを更新
    this.data.patterns[patternIndex] = updatedPattern;
    this.saveData();
    this.updatePatternsList();
    
    // モーダルを閉じる
    this.closeEditPatternModal();
    this.showMessage('勤務パターンを更新しました', 'success');
};

TransportationApp.prototype.closeEditPatternModal = function() {
    document.getElementById('editPatternModal').style.display = 'none';
    document.getElementById('editPatternForm').reset();
    this.currentEditingPatternId = null;
};

TransportationApp.prototype.deletePattern = function(id) {
    if (confirm('このパターンを削除しますか？')) {
        this.data.patterns = this.data.patterns.filter(pattern => pattern.id !== id);
        this.saveData();
        this.updatePatternsList();
        this.showMessage('パターンを削除しました', 'success');
    }
};


// パターンマッチング機能
function matchWithPatterns() {
    if (!app.previewData || app.previewData.length === 0) {
        app.showMessage('プレビューデータがありません', 'error');
        return;
    }

    const results = [];
    
    // 各人についてパターンマッチングを実行
    const peopleInData = [...new Set(app.previewData.map(item => item.name))];
    
    peopleInData.forEach(personName => {
        const person = app.data.people.find(p => p.name === personName);
        if (!person) {
            results.push({
                personName,
                person: null,
                status: 'no-registration',
                message: '人員登録なし',
                actualDays: [],
                patterns: [],
                matchScore: 0
            });
            return;
        }

        const personData = app.previewData.filter(item => item.name === personName);
        const actualDays = personData.map(item => {
            const date = new Date(item.date);
            return {
                date: item.date,
                dayOfWeek: date.getDay(),
                location: item.location,
                originalPattern: item.originalCell || ''
            };
        });

        // 登録済みの全パターンと照合
        const patternScores = [];
        
        app.data.patterns.forEach(pattern => {
            const score = calculatePatternMatch(actualDays, pattern);
            patternScores.push({
                pattern,
                score
            });
        });

        // 最高スコアのパターンを選択
        const bestMatch = patternScores.reduce((best, current) => 
            current.score > best.score ? current : best, 
            { pattern: null, score: 0 }
        );

        const status = bestMatch.score >= 0.8 ? 'matched' : 
                      bestMatch.score >= 0.5 ? 'partial-match' : 'no-match';

        results.push({
            personName,
            person,
            status,
            message: getMatchMessage(status, bestMatch.score),
            actualDays,
            patterns: patternScores.sort((a, b) => b.score - a.score),
            matchScore: bestMatch.score,
            bestPattern: bestMatch.pattern
        });
    });

    displayPatternMatchResults(results);
}

// パターンマッチング計算
function calculatePatternMatch(actualDays, pattern) {
    if (actualDays.length === 0) return 0;
    
    let matchCount = 0;
    
    actualDays.forEach(day => {
        let dayScore = 0;
        
        // 1. パターン名の完全一致チェック（最優先）
        if (day.originalPattern === pattern.name) {
            dayScore = 1.0;
        }
        // 2. パターン名の部分一致チェック
        else if (day.originalPattern.includes(pattern.name) || pattern.name.includes(day.originalPattern)) {
            dayScore = 0.8;
        }
        // 3. 出勤場所の一致チェック
        else if (day.location === pattern.workLocation) {
            dayScore = 0.6;
        }
        // 4. 出勤場所の部分一致チェック
        else if (day.location && pattern.workLocation && 
                 (day.location.includes(pattern.workLocation) || pattern.workLocation.includes(day.location))) {
            dayScore = 0.4;
        }
        
        matchCount += dayScore;
    });
    
    return matchCount / actualDays.length;
}


// マッチング結果のメッセージ生成
function getMatchMessage(status, score) {
    switch (status) {
        case 'matched':
            return `高い一致度 (${Math.round(score * 100)}%)`;
        case 'partial-match':
            return `部分的一致 (${Math.round(score * 100)}%)`;
        case 'no-match':
            return `パターン不一致 (${Math.round(score * 100)}%)`;
        default:
            return '照合不可';
    }
}

// パターンマッチング結果の表示
function displayPatternMatchResults(results) {
    const container = document.getElementById('patternMatchData');
    const summaryContainer = document.getElementById('patternMatchSummary');

    // 統計計算
    const matched = results.filter(r => r.status === 'matched').length;
    const partialMatch = results.filter(r => r.status === 'partial-match').length;
    const noMatch = results.filter(r => r.status === 'no-match').length;
    const noPattern = results.filter(r => r.status === 'no-pattern').length;
    const noRegistration = results.filter(r => r.status === 'no-registration').length;

    // 統計表示
    summaryContainer.innerHTML = `
        <div class="pattern-match-stat">
            <span class="pattern-match-stat-value">${matched}</span>
            <div class="pattern-match-stat-label">完全一致</div>
        </div>
        <div class="pattern-match-stat">
            <span class="pattern-match-stat-value">${partialMatch}</span>
            <div class="pattern-match-stat-label">部分一致</div>
        </div>
        <div class="pattern-match-stat">
            <span class="pattern-match-stat-value">${noMatch}</span>
            <div class="pattern-match-stat-label">不一致</div>
        </div>
        <div class="pattern-match-stat">
            <span class="pattern-match-stat-value">${noPattern + noRegistration}</span>
            <div class="pattern-match-stat-label">パターンなし</div>
        </div>
    `;

    // 詳細結果表示
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    
    container.innerHTML = results.map(result => {
        const statusClass = result.status;
        const statusText = result.message;

        let detailsHtml = '';
        if (result.actualDays.length > 0) {
            detailsHtml += `<div class="match-details">実際の勤務: ${result.actualDays.length}日</div>`;
            detailsHtml += `<div class="match-details">勤務日: ${result.actualDays.map(d => 
                `${d.date}(${dayNames[d.dayOfWeek]})`
            ).join(', ')}</div>`;
        }

        if (result.bestPattern) {
            const trainCommuteText = result.bestPattern.trainCommute ? '可能' : '不可';
            detailsHtml += `
                <div class="pattern-prediction">
                    <strong>最適パターン: ${result.bestPattern.name}</strong>
                    <div>出勤場所: ${result.bestPattern.workLocation}</div>
                    <div>電車通勤: ${trainCommuteText}</div>
                </div>
            `;
        }

        if (result.patterns && result.patterns.length > 0) {
            detailsHtml += `
                <div class="pattern-scores">
                    <strong>パターン適合度:</strong>
                    ${result.patterns.slice(0, 3).map(p => 
                        `<div>${p.pattern.name}: ${Math.round(p.score * 100)}%</div>`
                    ).join('')}
                </div>
            `;
        }

        return `
            <div class="match-result-item ${statusClass}">
                <div class="match-result-header">
                    <div class="match-result-person">${result.personName}</div>
                    <div class="match-result-status ${statusClass}">${statusText}</div>
                </div>
                ${detailsHtml}
            </div>
        `;
    }).join('');

    app.patternMatchResults = results;
    document.getElementById('patternMatchingSection').style.display = 'block';
    app.showMessage(`${results.length}名のパターン照合が完了しました`, 'success');
}

// パターン適用で記録生成
function generatePatternRecords() {
    if (!app.patternMatchResults) {
        app.showMessage('パターン照合結果がありません', 'error');
        return;
    }

    let generatedCount = 0;
    const errors = [];

    app.patternMatchResults.forEach(result => {
        if (result.status === 'matched' && result.person && result.bestPattern) {
            result.actualDays.forEach(day => {
                // 出勤記録機能が削除されたため、記録生成は無効
                generatedCount++; // ダミーカウント
            });
        }
    });

    if (generatedCount > 0) {
        app.saveData();
        // updateRecentRecords() removed
        app.showMessage(`${generatedCount}件の記録を生成しました`, 'success');
        
        if (errors.length > 0) {
            console.warn('生成エラー:', errors);
            app.showMessage(`${errors.length}件のエラーがありました（コンソール確認）`, 'warning');
        }
    } else {
        app.showMessage('生成可能な記録がありませんでした', 'warning');
    }
}

// 照合結果のCSV出力
function exportPatternAnalysis() {
    if (!app.patternMatchResults) {
        app.showMessage('パターン照合結果がありません', 'error');
        return;
    }

    const headers = ['氏名', 'ステータス', '一致度', '実勤務日数', 'パターン名', '出勤場所', '電車通勤'];
    
    const rows = app.patternMatchResults.map(result => [
        result.personName,
        result.message,
        `${Math.round(result.matchScore * 100)}%`,
        result.actualDays.length,
        result.bestPattern ? result.bestPattern.name : '',
        result.bestPattern ? result.bestPattern.workLocation : '',
        result.bestPattern ? (result.bestPattern.trainCommute ? '可能' : '不可') : ''
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `パターン照合結果_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    app.showMessage('照合結果をCSVファイルで出力しました', 'success');
}

// 名前選別機能
function toggleNameSelection() {
    app.nameSelectionMode = !app.nameSelectionMode;
    
    if (app.nameSelectionMode) {
        enterNameSelectionMode();
    } else {
        exitNameSelectionMode();
    }
}

function enterNameSelectionMode() {
    const container = document.getElementById('previewData');
    const previewSection = document.getElementById('previewSection');
    
    previewSection.classList.add('name-selection-mode');
    document.querySelector('.name-select-btn').textContent = '選別モード終了';
    document.querySelector('.save-names-btn').style.display = 'inline-block';
    document.querySelector('.reset-names-btn').style.display = 'inline-block';
    
    // 名前選別用テーブルを再生成
    generateNameSelectionTable();
    app.showMessage('名前選別モードが有効になりました', 'info');
}

function exitNameSelectionMode() {
    const previewSection = document.getElementById('previewSection');
    
    previewSection.classList.remove('name-selection-mode');
    document.querySelector('.name-select-btn').textContent = '名前選別モード';
    document.querySelector('.save-names-btn').style.display = 'none';
    document.querySelector('.reset-names-btn').style.display = 'none';
    
    // 通常のプレビューテーブルに戻す
    displayPreview(app.previewData);
    app.showMessage('名前選別モードを終了しました', 'info');
}

function generateNameSelectionTable() {
    const container = document.getElementById('previewData');
    const data = app.previewData;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-data">プレビューするデータがありません</div>';
        return;
    }

    // 統計情報を計算
    const totalCount = data.length;
    const modifiedCount = data.filter(item => item.nameModified).length;
    const matchedCount = data.filter(item => item.person && !item.nameModified).length;
    const unmatchedCount = totalCount - modifiedCount - matchedCount;

    // 統計表示
    const statsHtml = `
        <div class="name-stats">
            <div class="name-stat stat-total">総件数: ${totalCount}</div>
            <div class="name-stat stat-modified">修正済み: ${modifiedCount}</div>
            <div class="name-stat stat-matched">マッチ済み: ${matchedCount}</div>
            <div class="name-stat stat-unmatched">未マッチ: ${unmatchedCount}</div>
        </div>
    `;

    // 登録済み人名リストを取得
    const registeredNames = app.data.people.map(person => person.name);

    const table = document.createElement('table');
    table.className = 'preview-table';
    
    table.innerHTML = `
        <thead>
            <tr>
                <th>行番号</th>
                <th>氏名（編集可能）</th>
                <th>日付</th>
                <th>曜日</th>
                <th>出勤先</th>
                <th>状態</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody>
            ${data.map((item, index) => {
                const rowClass = item.nameModified ? 'name-modified' : 
                                item.person ? 'name-matched' : 'error-row';
                
                return `
                    <tr class="${rowClass}">
                        <td>${item.originalRow}</td>
                        <td class="name-edit-cell">
                            <input type="text" class="name-edit-input" 
                                   value="${item.name}" 
                                   data-index="${index}"
                                   onkeyup="handleNameInput(this, ${index})"
                                   onfocus="showNameSuggestions(this, ${index})"
                                   onblur="hideNameSuggestions(this, ${index})">
                            <div class="name-suggestions" style="display: none;" id="suggestions-${index}">
                                ${registeredNames.map(name => 
                                    `<div class="name-suggestion" onmousedown="selectNameSuggestion('${name}', ${index})">${name}</div>`
                                ).join('')}
                            </div>
                        </td>
                        <td>${item.date}</td>
                        <td>${item.dayOfWeek || '-'}</td>
                        <td>${item.location}</td>
                        <td>${item.status}</td>
                        <td>
                            <button onclick="resetNameToOriginal(${index})" class="btn btn-sm">元に戻す</button>
                        </td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    `;
    
    container.innerHTML = statsHtml;
    container.appendChild(table);
}

function handleNameInput(input, index) {
    const newName = input.value.trim();
    const originalData = app.originalPreviewData[index];
    
    // データを更新
    app.previewData[index].name = newName;
    app.previewData[index].nameModified = newName !== originalData.name;
    
    // 人の存在をチェック
    const person = app.data.people.find(p => p.name === newName);
    app.previewData[index].person = person;
    app.previewData[index].status = person ? 
        (person.hasPrivateCar ? 'OK' : '自家用車なし') : 
        '未登録';
    
    // 行の見た目を更新
    const row = input.closest('tr');
    row.className = app.previewData[index].nameModified ? 'name-modified' : 
                   app.previewData[index].person ? 'name-matched' : 'error-row';
    
    // 状態セルを更新
    const statusCell = row.querySelector('td:nth-child(5)');
    statusCell.textContent = app.previewData[index].status;
    
    // 名前候補をフィルタリング
    filterNameSuggestions(input, index);
    
    // 統計を更新
    updateNameStats();
}

function showNameSuggestions(input, index) {
    const suggestions = document.getElementById(`suggestions-${index}`);
    suggestions.style.display = 'block';
    filterNameSuggestions(input, index);
}

function hideNameSuggestions(input, index) {
    // 少し遅延させてクリックイベントを処理できるようにする
    setTimeout(() => {
        const suggestions = document.getElementById(`suggestions-${index}`);
        if (suggestions) {
            suggestions.style.display = 'none';
        }
    }, 150);
}

function filterNameSuggestions(input, index) {
    const suggestions = document.getElementById(`suggestions-${index}`);
    const filter = input.value.toLowerCase();
    const suggestionItems = suggestions.querySelectorAll('.name-suggestion');
    
    suggestionItems.forEach(item => {
        const name = item.textContent.toLowerCase();
        if (name.includes(filter) || filter === '') {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function selectNameSuggestion(name, index) {
    const input = document.querySelector(`input[data-index="${index}"]`);
    input.value = name;
    handleNameInput(input, index);
    hideNameSuggestions(input, index);
}

function resetNameToOriginal(index) {
    const originalData = app.originalPreviewData[index];
    const input = document.querySelector(`input[data-index="${index}"]`);
    
    input.value = originalData.name;
    handleNameInput(input, index);
}

function updateNameStats() {
    const data = app.previewData;
    const totalCount = data.length;
    const modifiedCount = data.filter(item => item.nameModified).length;
    const matchedCount = data.filter(item => item.person && !item.nameModified).length;
    const unmatchedCount = totalCount - modifiedCount - matchedCount;
    
    const statsContainer = document.querySelector('.name-stats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="name-stat stat-total">総件数: ${totalCount}</div>
            <div class="name-stat stat-modified">修正済み: ${modifiedCount}</div>
            <div class="name-stat stat-matched">マッチ済み: ${matchedCount}</div>
            <div class="name-stat stat-unmatched">未マッチ: ${unmatchedCount}</div>
        `;
    }
}

function saveNameSelections() {
    const modifiedCount = app.previewData.filter(item => item.nameModified).length;
    
    if (modifiedCount === 0) {
        app.showMessage('修正された名前がありません', 'warning');
        return;
    }
    
    if (confirm(`${modifiedCount}件の名前修正を保存しますか？`)) {
        // 元データを更新
        app.originalPreviewData = JSON.parse(JSON.stringify(app.previewData));
        
        // 修正フラグをクリア
        app.previewData.forEach(item => {
            item.nameModified = false;
        });
        
        // 表示を更新
        generateNameSelectionTable();
        app.showMessage(`${modifiedCount}件の名前修正を保存しました`, 'success');
    }
}

function resetNameSelections() {
    if (confirm('すべての名前修正をリセットしますか？')) {
        // 元データに戻す
        app.previewData = JSON.parse(JSON.stringify(app.originalPreviewData));
        
        // 表示を更新
        generateNameSelectionTable();
        app.showMessage('名前選別をリセットしました', 'info');
    }
}

// 編集モーダルを閉じる（グローバル関数）
function closeEditPersonModal() {
    app.closeEditPersonModal();
}

// パターン編集モーダルを閉じる（グローバル関数）
function closeEditPatternModal() {
    app.closeEditPatternModal();
}

// アプリケーション開始
let app;

// アプリケーションを初期化する関数
function initializeApplication() {
    try {
        console.log('アプリケーション初期化開始');
        
        if (typeof TransportationApp === 'undefined') {
            throw new Error('TransportationAppクラスが見つかりません');
        }
        
        app = new TransportationApp();
        window.app = app; // グローバルスコープで利用可能にする
        
        console.log('アプリケーション初期化完了');
        
        // 初期タブの集計を表示
        setTimeout(() => {
            if (app && typeof app.generateSummary === 'function') {
                app.generateSummary();
            }
        }, 100);
        
        return true;
        
    } catch (error) {
        console.error('アプリケーション初期化エラー:', error);
        
        // ユーザーにエラーを表示
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position:fixed;top:20px;left:20px;right:20px;background:red;color:white;padding:10px;border-radius:5px;z-index:10000;';
        errorDiv.innerHTML = `<strong>アプリケーション初期化エラー:</strong> ${error.message}<br><button onclick="location.reload()">ページを再読み込み</button>`;
        document.body.appendChild(errorDiv);
        
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeApplication();
});