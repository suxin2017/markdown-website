/**
 * @callback handleTextCallBack
 * @param {string} text
 */

/**
 *
 * @param {HTMLTextAreaElement} node
 * @constructor
 */
function Editor(node, onChange) {
    this.node = node;
    this.command = {};
    this.event = {onChange};
    // TODO: 修改栈道
    this.undoStash = [];
    this.redoStash = [];

    this._init();
}

/**
 * 移动光标到指定位置
 * @param {number} start
 * @param {number=} end
 */
Editor.prototype.moveCursor = function moveCursor(start, end) {
    let node = this.node;
    node.focus()
    node.selectionStart = start;
    if (end == null) {
        node.selectionEnd = start
    } else {
        node.selectionEnd = end;
    }
}

Editor.prototype.onChange = function onChange(fn){
    this.node.addEventListener("change", fn)
}

Editor.prototype.onInput = function onInput(fn){
    this.node.addEventListener("input", fn)
}

/**
 * @returns {[number, number]}
 */
Editor.prototype.getCurrentSelectionPosition = function () {
    const node = this.node;
    return [node.selectionStart, node.selectionEnd]
}

/**
 * @returns {string | string}
 */
Editor.prototype.getText = function () {
    return this.node.value || "";
}
/**
 * @param {string} text
 */
Editor.prototype.setText = function (text) {
    this.event.onChange(text)
    this.node.value = text
}

/**
 * 编辑行操作
 * @param prefix
 * @param cb
 * @return Editor
 */
Editor.prototype.editLineText = function editLineText(prefix, cb = (text) => ({text,offset:text.length})) {
    const [start,end] = this.getCurrentSelectionPosition();
    const text = this.getText();
    let lineStart = text.lastIndexOf("\n", start);
    let lineEnd = text.indexOf("\n", end);
    if(lineStart === -1){
        lineStart = 0;
    }
    if (lineEnd === -1) {
        lineEnd = text.length
    }

    let lineText = text.substring(lineStart, lineEnd);
    let {text:contentText,offset:textOffset} = cb(lineText);
    // 保持光标在行尾部
    const cursorOffset = lineStart + prefix.length + textOffset;
    const newText = text.substring(0, lineStart) + prefix + contentText + text.substring(lineEnd)
    this.setText(newText);
    this.moveCursor(cursorOffset);
    return this;
}

/**
 * 编辑行内操作
 * @param {string} prefix
 * @param {string=} suffix
 * @param {handleTextCallBack} cb
 * @return Editor
 */
Editor.prototype.editInlineText = function (prefix,
                                            suffix,
                                            cb = (text) => text) {
    if (suffix == null) {
        suffix = prefix
    }
    const [start, end] = this.getCurrentSelectionPosition();
    const text = this.getText();
    let cursorOffset = start;
    let newText = "";
    if (start === end) {
        newText = text.substr(0, start) + prefix + suffix + text.substr(start);
        cursorOffset += prefix.length;
    } else {
        let rangeText = text.substr(start, end);
        let contentText = cb(rangeText);
        newText = text.substr(0, start) + prefix + contentText + suffix + text.substr(end);
        cursorOffset += prefix.length + rangeText.length;
    }
    this.setText(newText);
    this.moveCursor(cursorOffset);
    return this;
}

/**
 * 初始化自动focus
 */
Editor.prototype._init = function () {
    this.node.focus();
    this.registerCoreCommand();
}

Editor.prototype.execCommand = function (command) {
    const commandFn = this.command[command];
    if (commandFn != null && typeof commandFn === 'function') {
        commandFn.call(this);
    } else {
        console.warn("执行命令未能找到，请检查是否存在执行命令")
    }
    return this;
}

Editor.prototype.registerCommand = function (command, fn) {
    this.command[command] = fn;
    return this;
}

Editor.prototype.registerCoreCommand = function () {
    const lineRules = {
        h1: "# ",
        h2: "## ",
        h3: "### ",
        h4: "#### ",
        h5: "##### ",
        h6: "###### ",
        blockquote: "> ",
        image: "![imageTitle](http://imageurl/xx.png)",
        link: "[link](https://www.baidu.com)",
    }
    const inlineRules = {
        bold: "**",
        italic: "*",
        del: "~~",
    }

    for (let ruleName in lineRules) {
        this.registerCommand(ruleName, () => {
            this.editLineText(lineRules[ruleName])
        })
    }
    for (let ruleName in inlineRules) {
        this.registerCommand(ruleName, () => {
            this.editInlineText(inlineRules[ruleName])
        })
    }

    const moreRowRules = {
        code:(text)=>{
            return {
                text:`\n\`\`\`\n${text}\n\`\`\`\n`,
                offset:5+text.length,
            }
        },
        table:(text)=> {
            let result = `${text}
header 1 | header 2
---|---
row 1 col 1 | row 1 col 2
row 2 col 1 | row 2 col 2`;
            return {
                text:result,
                offset:result.length
            }
        },
        list:(text)=>{
            let result = "- "+ text.replace(/\n/g,"\n- ");
            return {
                text:result,
                offset:result.length
            }
        }
    }

    for (let ruleName in moreRowRules) {
        this.registerCommand(ruleName, () => {
            this.editLineText("",(text)=>{
               return  moreRowRules[ruleName](text);
            })
        })
    }
}


export default Editor