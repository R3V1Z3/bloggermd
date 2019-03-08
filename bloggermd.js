/*
    MM    MM   AAA   RRRRRR  KK  KK DDDDD    OOOOO  WW      WW NN   NN
    MMM  MMM  AAAAA  RR   RR KK KK  DD  DD  OO   OO WW      WW NNN  NN
    MM MM MM AA   AA RRRRRR  KKKK   DD   DD OO   OO WW   W  WW NN N NN
    MM    MM AAAAAAA RR  RR  KK KK  DD   DD OO   OO  WW WWW WW NN  NNN
    MM    MM AA   AA RR   RR KK  KK DDDDDD   OOOO0    WW   WW  NN   NN
*/

/**
    Provides all methods for rendering Markdown content
*/
class Markdown {

  constructor() {
    this.references = [];
  }

  // find first character in str that is not char and return its location
  find_first_char_not(char, str) {
    for (var i = 0; i < str.length; i++) {
      if (str[i] != char) return i;
    }
    return -1;
  };

  extractReferences(c) {
    this.references = [];
    let block = false;
    c.split('\n').forEach((l, i) => {

      // ignore if we're within a code block
      if (l.startsWith('```')) block = !block;
      if (block) return;

      // also ignore references in headings
      const h = this.find_first_char_not('#', l);
      if (h > 0 && l.charAt(h) === ' ') return;

      // not in block, so check for match
      let r = l.match(/\[(.*?)\]\: (.*)/g);
      if (r !== null) {
        this.references.push([i, r[0]]);
      }
    });
    return this.references;
  }

  // returns a specific reference from input references array
  getReference(match) {
    let s = match.split('][');
    let title = s[0].substr(1);
    let id = s[1].substr(0, s[1].length - 1);
    let found = this.references.find(i => {
      let c = i[1];
      let name = c.substr(1).split(']: ')[0];
      return id === name;
    });
    if (found === null || found === undefined) {
      return `<a href="/">${title}</a>`;
    }
    let parts = found[1].split(' ');
    let href = parts[1];
    let alt = '';
    if (parts.length > 2) alt = ' alt=' + parts[2];
    let result = `<a href="${href} ${alt}">${title}</a>`;
    return result;
  }

  // handler for inline markdown such as emphases and links
  inlineHandler(l) {

    // IMAGES
    // ![title](href "alt")
    l = l.replace(/!\[(.*?)\]\((.*) "(.*)"\)/g, `<img src="$2" title="$1" alt="$3">`);
    // ![title](href)
    l = l.replace(/!\[(.*?)\]\((.*)\)/g, `<img src="$2" title="$1">`);

    // LINKS
    // Non-reference links [title](href)
    l = l.replace(/\[(.*?)\]\((.*)\)/g, `<a href="$2">$1</a>`);
    // Reference links [title][id]
    l = l.replace(/\[(.*?)\]\[(.[^\[\]]*)\]/g, (match) => {
      return this.getReference(match);
    });
    // <href>
    l = l.replace(/\<(http.*)\>/g, `<a href="$2">$1</a>`);
    // Reference links [title][]

    // bold
    l = l.replace(/\*\*(?! )(.*?)(?! )\*\*/g, `<strong>$1</strong>`);
    l = l.replace(/__(?! )(.*?)(?! )__/g, `<strong>$1</strong>`);

    // emphases
    l = l.replace(/(!")_(?! )(.*?)(?! )_(!")/g, `<em>$1</em>`);
    l = l.replace(/\*(?! )(.*?)(?! )\*/g, `<em>$1</em>`);

    // strikethrough
    l = l.replace(/~~(?! )(.*?)(?! )~~/g, `<s>$1</s>`);

    return l;
  }

  tableHandler(table) {
    let t = '';
    let lines = table.split('\n');
    let definition = lines[1];
    let columns = definition.split('|');
    columns.shift();
    columns.pop();
    let align = [];
    columns.forEach(c => {
      let a = '';
      c = c.trim();
      if (c.startsWith(':') && c.endsWith(':')) a = 'center';
      else if (c.endsWith(':')) a = 'right';
      else if (c.startsWith(':')) a = 'left';
      align.push(a);
    });
    columns = columns.length;
    t += '<table>\n';
    t += '<tbody>\n';
    lines.forEach((l, i) => {
      if (i === 1 || i === lines.length - 1) return;
      let td = '<td>\n';
      if (i === 0) {
        t += t += '<thead>\n';
        td = '<th>\n';
      }
      t += '<tr>\n';
      for (let c = 0; c <= columns; c++) {
        if (align[c - 1] !== '') {
          t += td.replace('>', ` align="${align[c - 1]}">`);
        } else t += td;
        t += l.split('|')[c] + '\n';
        t += td.replace('<', '</');
      }
      t += '</tr>\n';
      if (i === 0) t += '</thead>\n';
    });
    t += '</tbody>\n';
    t += '</table>\n';
    return t;
  }

  // returns character found at start of line if character is a list symbol
  listChr(l) {
    l = l.trim();
    let listChr = '';
    // handle unordered list <UL>
    if (l.startsWith('- ')) listChr = '-';
    else if (l.startsWith('* ')) listChr = '*';
    if (listChr !== '') return listChr;

    // handle orderered list <OL>
    listChr = l.match(/^(\d+). /);
    if (listChr === null) return '';
    return l.split(' ')[0];
  }

  render(c) {

    // send content through first pass to get any reference links
    this.extractReferences(c);

    let result = '';
    // markup within code blocks should be treated differently
    // block designates what type of block we're in: code, inline-code
    let block = '';

    let blockquote = false;

    // similarly, list holds the list type: ol, ul
    let list = '';
    let listLevel = -1;
    let listSpaces = 2;

    let table = '';

    const lines = c.split('\n');
    lines.forEach((l, i) => {

      let paragraph = true;

      // Close UL if first character is not a list character and listLevel is 0 or greater
      let chr = this.listChr(l);
      if (chr === '' && listLevel > -1) {
        let tag = `</${list}>`;
        result += tag + tag.repeat(listLevel);
        list = '';
        listLevel = -1;
      }

      // Close BLOCKQUOTE
      if (blockquote && !l.trim().startsWith('> ')) {
        result += '<p>\n</blockquote>\n';
        blockquote = false;
      }

      // HEADINGS
      const x = this.find_first_char_not('#', l);
      if (block === '' && x > 0 && l.charAt(x) === ' ') {
        // assign appropriate heading level and truncated heading text
        l = `<h${x}>${l.substr(x)}</h${x}>`;
        paragraph = false;
      }
      if (block === '' && i < lines.length - 1) {
        if (lines[i + 1].startsWith('---')) {
          l = `<h2>${l}</h2>`;
          paragraph = false;
        } else if (lines[i + 1].startsWith('===')) {
          l = `<h1>${l}</h1>`;
          paragraph = false;
        }
      }

      // <HR>

      if (block === '') {
        if (l.startsWith('---') || l.startsWith('***') ||
          l.startsWith('___') || l.startsWith('===') ||
          l.startsWith('- - -') || l.startsWith('* * *')) {
          paragraph = false;
          l = '<hr />';
        }
      }

      // CODE
      if (l.startsWith('```')) {
        paragraph = false;
        // get any extra text after ```
        let classes = l.split('```')[1];
        if (classes.trim().length < 1) classes = '';
        else classes = ` class="${classes}" `;
        if (block === '') {
          block = 'code';
          l = `<pre ${classes}><code>`;
        } else if (block === 'code') {
          block = '';
          l = '</pre></code>';
        }
      }
      if (block === 'code') paragraph = false;

      // PRE tag
      if (l.trim().startsWith('<pre')) {
        paragraph = false;
        if (block === '') block = 'pre';
      }
      if (l.trim().startsWith('</pre')) block = '';
      if (block === 'pre') paragraph = false;

      // special consideration for html comments
      if (block !== '' && l.startsWith('<!--')) {
        l = l.replace('<!--', '&lt;!--');
      }

      // inline-code
      l = l.replace(/\`/g, f => {
        if (block === '') {
          block = 'inline-code';
          return '<code>';
        } else if (block === 'inline-code') {
          block = '';
          return '</code>';
        } else return '`';
      });

      // BLOCKQUOTE
      if (l.trim().startsWith('> ') && block === '') {
        if (!blockquote) {
          l = '<blockquote>\n<p>' + l.substr(2);
          blockquote = true;
        } else l = l.substr(2);
      }
      if (blockquote) paragraph = false;

      // TABLES

      // Close TABLE
      if (!l.startsWith('|') && table !== '') {
        // table has content but this line doesn't have table code
        // so lets close the table up and add entire contents as new line
        l += '\n' + this.tableHandler(table) + '\n';
        table = '';
        paragraph = false;
        block = '';
      } else if (l.startsWith('|')) {
        if (block === '') block = 'table';
        table += l + '\n';
        l = '';
      }
      if (table !== '') paragraph = false;

      // ======================== INLINE ELEMENTS =========================
      // Inline elements such as emphases and links
      if (block === '') l = this.inlineHandler(l);

      // LISTS <UL> and <OL>
      chr = this.listChr(l);
      if (chr !== '' && block === '') {
        let type = 'ul';
        if (!isNaN(chr)) type = 'ol';
        let spaces = l.split(chr + ' ')[0].length;
        let oldLevel = listLevel;
        let newLevel = Math.floor(spaces / listSpaces);

        if (list === '') {
          listLevel = 0;
          list = type;
          l = `<${type}>\n<li>${l.trim().substr(2)}</li>`;
        } else if (newLevel > listLevel) {
          listLevel += 1;
          list = type;
          l = `<${type}>\n<li>${l.trim().substr(2)}</li>`;
        } else if (newLevel === listLevel) {
          l = `<li>${l.trim().substr(2)}</li>`;
        } else if (newLevel < listLevel) {
          listLevel = newLevel;
          let tag = `</${list}>\n`;
          tag = tag.repeat(oldLevel - listLevel);
          l = tag + `<li>${l.trim().substr(2)}</li>`;
        }
      }
      if (list !== '') paragraph = false;

      if (block === '') {
        // don't add paragraph if line begins with html open symbol
        if (l.startsWith('<')) paragraph = false;
        // allow some tags at start of line to designate paragraph
        if (l.startsWith('<s>')) paragraph = true;
        if (l.startsWith('<em>')) paragraph = true;
        if (l.startsWith('<strong>')) paragraph = true;
      }

      if (paragraph && l.length > 0) l = '<p>' + l + '</p>';
      if (l.includes('<pre')) result += l;
      else if (l.length < 1) result += l;
      else result += l + '\n';
    });
    return result;
  }

}

let el = document.querySelector(".post-body.entry-content");
// we'll first remove br tags
let br = el.getElementsByTagName('br');
while (br.length) {
  br[0].parentNode.removeChild(br[0]);
}
// now make the conversion and render it
let md = new Markdown();
let c = el.innerHTML;
el.innerHTML = md.render(c);
