import React from "react";
import MarkdownIt from "markdown-it";
import emoji from "markdown-it-emoji";
import subscript from "markdown-it-sub";
import superscript from "markdown-it-sup";
import footnote from "markdown-it-footnote";
import deflist from "markdown-it-deflist";
import abbreviation from "markdown-it-abbr";
import insert from "markdown-it-ins";
import mark from "markdown-it-mark";
import tasklists from "markdown-it-task-lists";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-light.css";
import classNames from "classnames";
import styles from "./index.module.sass";
import { useEffect } from "react";
const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (__) {}
    }
    return ""; // use external default escaping
  },
})
  .use(emoji)
  .use(subscript)
  .use(superscript)
  .use(footnote)
  .use(deflist)
  .use(abbreviation)
  .use(insert)
  .use(mark)
  .use(tasklists);

let themeStyle = document.getElementById("theme-style");
if (!themeStyle) {
  themeStyle = document.createElement("style");
  themeStyle.id = "theme-style";
  document.head.appendChild(themeStyle);
}

function getPreviewStyle(style) {
  let mkstyle = document.getElementById("mk-style");
  if (!mkstyle) {
    mkstyle = document.createElement("style");
    mkstyle.id = "mk-style";
    mkstyle.textContent = style;
    document.head.appendChild(mkstyle);
  } else {
    mkstyle.textContent = style;
  }
  return mkstyle;
}

function Preview({ code, previewMode, style }) {
  const boxClass = classNames(styles.common, {
    [styles.mobile]: previewMode === "mobile",
    [styles.pc]: previewMode === "pc",
  });

  useEffect(() => {
    getPreviewStyle(style);
  }, [style]);

  return (
    <section id="make" className={boxClass}>
      <div dangerouslySetInnerHTML={{ __html: mdParser.render(code) }}></div>
    </section>
  );
}

export default Preview;
