function sovereignVault() {
    return {
        search: '',
        filter: 'all',
        islandStatus: 'idle',
        islandMsg: '',
        islandIcon: 'check',
        isSynced: false,
        dragActive: false,
        focusMode: false,
        previewMode: false,
        previewHtml: '',
        focusedEntry: {},
        newEntry: { title: '', tag: '', content: '', type: 'code', isLocked: false, pin: '' },
        entries: [],

        init() {
            const saved = localStorage.getItem('sovereign_v5');
            if(saved) this.entries = JSON.parse(saved).map(e => ({...e, isUnlocked: false}));
            this.$nextTick(() => lucide.createIcons());
        },

        triggerIsland(msg, icon = 'check', status = 'active') {
            this.islandMsg = msg;
            this.islandIcon = icon;
            this.islandStatus = status;
            setTimeout(() => {
                this.islandStatus = 'idle';
                this.$nextTick(() => lucide.createIcons());
            }, 3000);
            this.$nextTick(() => lucide.createIcons());
        },

        toggleLock() {
            this.newEntry.isLocked = !this.newEntry.isLocked;
            if(!this.newEntry.isLocked) this.newEntry.pin = '';
            this.$nextTick(() => lucide.createIcons());
        },

        toggleSync() {
            this.triggerIsland('Syncing to Cloud...', 'loader');
            setTimeout(() => {
                this.isSynced = !this.isSynced;
                this.triggerIsland(this.isSynced ? 'Connected to Database' : 'Disconnected', this.isSynced ? 'cloud-snow' : 'cloud-off');
            }, 1500);
        },

        saveEntry() {
            if(!this.newEntry.title || !this.newEntry.content) return this.triggerIsland('Incomplete Data', 'alert-circle', 'secure');
            if(this.newEntry.isLocked && this.newEntry.pin.length < 4) return this.triggerIsland('PIN 4-Digits Required', 'shield-alert', 'secure');
            
            this.entries.unshift({ id: Date.now(), date: new Date(), ...this.newEntry, isUnlocked: false });
            this.persist();
            this.newEntry = { title: '', tag: '', content: '', type: 'code', isLocked: false, pin: '' };
            this.triggerIsland('Commit Successful!');
        },

        handleUnlock(e, entry) {
            if(e.target.value === entry.pin) {
                entry.isUnlocked = true;
                this.triggerIsland('Access Granted', 'unlock');
            }
        },

        handleFileDrop(e) {
            this.dragActive = false;
            const file = e.dataTransfer.files[0];
            if(!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                this.newEntry.content = event.target.result;
                this.newEntry.title = file.name.split('.')[0];
                this.triggerIsland('File Extracted', 'file-text');
            };
            reader.readAsText(file);
        },

        extractColors(text) {
            if(!text) return [];
            const regex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
            const matches = text.match(regex);
            return matches ? [...new Set(matches)] : [];
        },

        openFocus(entry) {
            if(entry.isLocked && !entry.isUnlocked) return this.triggerIsland('Entry Locked', 'lock', 'secure');
            this.focusedEntry = entry;
            this.focusMode = true;
            this.$nextTick(() => lucide.createIcons());
        },

        openPreview(code) {
            const tailwindScript = '<script src="https://cdn.tailwindcss.com"><\/script>';
            this.previewHtml = `${tailwindScript} <div style="padding:20px;">${code}</div>`;
            this.previewMode = true;
        },

        closeModals() {
            this.focusMode = false;
            this.previewMode = false;
        },

        copyEntry(s) {
            if(s.isLocked && !s.isUnlocked) return this.triggerIsland('Entry Locked', 'lock', 'secure');
            navigator.clipboard.writeText(s.content);
            this.triggerIsland('Copied to Clipboard!');
        },

        async shareEntry(s) {
            if(s.isLocked && !s.isUnlocked) return this.triggerIsland('Entry Locked', 'lock', 'secure');
            if (navigator.share) {
                try { await navigator.share({ title: s.title, text: s.content }); } catch (err) {}
            } else {
                window.open(`https://wa.me/?text=${encodeURIComponent(s.title + '\n' + s.content)}`, '_blank');
            }
        },

        deleteEntry(id) {
            if(confirm('Purge this entry?')) {
                this.entries = this.entries.filter(e => e.id !== id);
                this.persist();
                this.triggerIsland('Purge Complete', 'trash-2');
            }
        },

        exportData() {
            const blob = new Blob([JSON.stringify(this.entries)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `Sovereign_v5_${Date.now()}.json`;
            a.click();
            this.triggerIsland('Data Exported');
        },

        persist() { localStorage.setItem('sovereign_v5', JSON.stringify(this.entries)); },
        scrollToForm() { document.getElementById('snippet-form').scrollIntoView({ behavior: 'smooth' }); },

        get filteredEntries() {
            let list = this.entries;
            if(this.filter === 'locked') list = list.filter(e => e.isLocked);
            if(this.search) {
                const q = this.search.toLowerCase();
                list = list.filter(e => e.title.toLowerCase().includes(q) || e.tag.toLowerCase().includes(q));
            }
            return list;
        }
    }
}
