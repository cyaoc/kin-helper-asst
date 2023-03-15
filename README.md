## KinHelperAsst

kintone 帮助手册助手，利用ChatGPT接口回答用户检索的问题。

## 安装

你需要安装Nodejs18以上的版本到本地。

```bash
git clone https://github.com/cyaoc/kin-helper-asst
```

进入项目根目录后运行

```bash
npm i
```

将根目录下的.env.sample文件重命名为.env文件。

前往[supabase](https://supabase.com/)注册新的账号，并创建新的free project。

复制对应的PUBLIC_URL和API_KEY到.env中。

申请[OpenAI](https://openai.com/)的 API KEY 并添加到.env中。

将schema.sql的sql复制到supabase项目中的sql editor中执行。

在scripts文件夹中放入要转换的kintone资料。

路径参考transform.js中的BASE_CONTENT定义，

默认配置为scripts目录下github/kintone/content

语言参考BASE_ZH定义，默认为zh

url拼接规则为BASE_URL + BASE_ZH + 文件相对BASE_CONTENT的路径。

运行

```bash
npm run transform
```

项目将对所有文章进行分割总结，分割大小为200左右的chunk（可自定义大小，详见CHUNK_SIZE），生成kintone.json

运行

```bash
npm run transform
```

会将kintone.json中的内容进行向量转换，并上传到supabase。

由于该操作涉及网络请求和openai向量转换操作，因此会影响openai的api使用量，而且速度较慢。

上传结束后，运行

```bash
npm run dev
```

[查看效果](http://localhost:3000)

## 感谢

[paul-graham-gpt](https://github.com/mckaywrigley/paul-graham-gpt)

[ChatGPT API使用案例：通过pgvector在Postgres中存储OpenAI嵌入](https://www.jdon.com/65386.html)