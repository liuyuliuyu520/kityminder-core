define(function(require, exports, module) {
    var kity = require('./kity');
    var utils = require('./utils');
    var Minder = require('./minder');
    var MinderNode = require('./node');
    var MinderEvent = require('./event');
    var compatibility = require('./compatibility');

    // 导入导出
    kity.extendClass(Minder, {

        /**
         * @method exportJson()
         * @for Minder
         * @description
         *     导出当前脑图数据为 JSON 对象，导出的数据格式请参考 [Data](data) 章节。
         * @grammar exportJson() => {plain}
         */
        exportJson: function() {
            /* 导出 node 上整棵树的数据为 JSON */
            function exportNode(node) {
                var exported = {};
                exported.data = node.getData();
                var childNodes = node.getChildren();
                if (childNodes.length) {
                    exported.children = [];
                    for (var i = 0; i < childNodes.length; i++) {
                        exported.children.push(exportNode(childNodes[i]));
                    }
                }
                return exported;
            }

            var json = exportNode(this.getRoot());

            json.template = this.getTemplate();
            json.theme = this.getTheme();
            json.version = Minder.version;

            return json;
        },

        /**
         * @method importJson()
         * @for Minder
         * @description 导入脑图数据，数据格式为 JSON，具体的数据字段形式请参考 [Data](data) 章节。
         *
         * @grammar importJson(json) => {this}
         *
         * @param {plain} json 要导入的数据
         */
        importJson: function(json) {

            function importNode(node, json, km) {
                var data = json.data;
                node.data = {};
                for (var field in data) {
                    node.setData(field, data[field]);
                }

                node.setData('text', data.text);

                var childrenTreeData = json.children || [];
                for (var i = 0; i < childrenTreeData.length; i++) {
                    var childNode = km.createNode(null, node);
                    importNode(childNode, childrenTreeData[i], km);
                }
                return node;
            }

            if (!json) return;

            /**
             * @event preimport
             * @for Minder
             * @when 导入数据之前
             */
            this._fire(new MinderEvent('preimport', null, false));

            // 删除当前所有节点
            while (this._root.getChildren().length) {
                this.removeNode(this._root.getChildren()[0]);
            }

            json = Minder.compatibility(json);

            importNode(this._root, json, this);

            this.setTemplate(json.template || 'default');
            this.setTheme(json.theme || null);
            this.refresh();

            /**
             * @event import,contentchange,interactchange
             * @for Minder
             * @when 导入数据之后
             */
            this.fire('import');

            this._firePharse({
                type: 'contentchange'
            });

            this._interactChange();

            return this;
        }
    });
});