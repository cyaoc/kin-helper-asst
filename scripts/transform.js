const fs = require('fs');
const path = require('path');
const { encode } = require('gpt-3-encoder');
const matter = require('gray-matter');
const removeMd = require('remove-markdown');
const toml = require('toml');

const BASE_DIR = path.resolve(__dirname, 'github/kintone');
const BASE_CONTENT = path.resolve(BASE_DIR, 'content');
const BASE_ZH = path.resolve(BASE_CONTENT, 'zh');
const BASE_URL = 'https://jp.cybozu.help/k/';
const CHUNK_SIZE = 200;

function list (dir, files, ignore=false) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
            list(itemPath, files);
        }
        if (stat.isFile() && path.extname(item) === ".md" && !ignore){
            files.push(itemPath); 
        }
    }
}

function transform (file) {
    const relative = path.relative(BASE_CONTENT, file);
    const filename = path.basename(relative);
    const dirname = path.dirname(relative);
    return (filename === "_index.md") ?  `${dirname}.html` : path.join(dirname, filename.replace(".md", ".html"));
}

function parse (path, config) {
    const { content, data } = matter(fs.readFileSync(path,'utf-8'));
    const tag_rex = /{{<\s*(\/?)([^}]+)\s*>}}/g;
    // const link_rex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const enter_ap_rex = /([\r\n]+|\{#[\w_]+\})/g;
    const result = removeMd(content.replace(tag_rex, (_match, _, key) =>  config[key] || ""))
                   .trim().replace(enter_ap_rex, '');
    const chunks = [];
    if (encode(result).length > CHUNK_SIZE) {
        const split = result.split('。');
        let chunk = "";
        split.forEach((el, index)=>{
            const full = `${el}。`
            if (encode(chunk).length + encode(full).length >= CHUNK_SIZE && chunk !== "" ) {
                chunks.push(chunk);
                chunk = "";
            }
            chunk += full;
            if (index === split.length - 1 ){
                chunks.push(chunk);
            }
        });
    } else {
        chunks.push(result) ;
    }
    return {
        url: `${BASE_URL}${transform(path)}`,
        title: data.title,
        content:chunks
    }
}

(()=>{
    const { params, Languages} = toml.parse(fs.readFileSync(path.resolve(BASE_DIR,'hugo_cn.toml'),'utf-8'));
    const config = Object.assign({},params, Languages.zh);
    const files = [];
    list(BASE_ZH,files,true)
    const objs = files.map((el)=> parse(el,config));
    fs.writeFileSync("scripts/kintone.json", JSON.stringify(objs));
})();