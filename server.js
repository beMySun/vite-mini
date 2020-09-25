// 用最传统的方式

const fs = require('fs');
const path = require('path');
const Koa = require('koa');
const compilerSfc = require('@vue/compiler-sfc');
const compileDom = require('@vue/compiler-dom');

const app = new Koa();

function rewriteImport(content) {
  // from 'xx'
  // from "xx"
  // 第三方模块做语法解析，仕最靠谱的
  return content.replace(/from ['"]([^'"]+)['"]/g, function (s0, s1) {
    // import a from './c.js'不需要改写
    // 只改写需要去node_module找的
    if (s1[0] !== '.' && s1[0] !== '/') {
      return `from '/@modules/${s1}'`;
    }
    return s0;
  });
}

// koa的基础语法
// 支持ts
// 支持sas
// 支持less
// 支持xx
// 这些都是类似webpack的loader的功能

app.use(async (ctx) => {
  // 不能直接用static，因为要编译.vue
  const {
    request: { url, query },
  } = ctx;

  if (url == '/') {
    let content = fs.readFileSync('./index.html', 'utf-8');
    content = content.replace(
      '<script',
      `
      <script>
        window.process = {env:{NODE_ENV:'DEV'}}
      </script>
      <script`
    );
    ctx.type = 'text/html';
    ctx.body = content;
  } else if (url.endsWith('.js')) {
    const p = path.resolve(__dirname, url.slice(1));
    const content = fs.readFileSync(p, 'utf-8');
    ctx.type = 'application/javascript';
    // import xx ffrom 'vue'; 改造成 import xx from '/@module/vue'
    ctx.body = rewriteImport(content);
  } else if (url.startsWith('/@modules/')) {
    // @todo 去node_module找的
    const prefix = path.resolve(__dirname, 'node_modules', url.replace('/@modules/', ''));
    const module = require(prefix + '/package.json').module;
    const p = path.resolve(prefix, module);
    // console.log('p', p);
    const ret = fs.readFileSync(p, 'utf-8');
    ctx.type = 'application/javascript';
    ctx.body = rewriteImport(ret);
  } else if (url.indexOf('.vue') > -1) {
    // 解析单文件组件
    const p = path.resolve(__dirname, url.split('?')[0].slice(1));
    const { descriptor } = compilerSfc.parse(fs.readFileSync(p, 'utf-8'));

    if (!query.type) {
      // 这是script
      ctx.type = 'application/javascript';
      ctx.body = `
        ${rewriteImport(descriptor.script.content).replace('export default', 'const __script= ')}
        import { render as __render } from "${url}?type=template"
        __script.render = __render
        export default __script
      `;
    } else if (query.type == 'template') {
      // template模板
      const template = descriptor.template;
      const render = compileDom.compile(template.content, { mode: 'module' }).code;
      // template=>render才能执行
      ctx.type = 'application/javascript';
      ctx.body = rewriteImport(render);
    }
  } else if (url.endsWith('.css')) {
    const p = path.resolve(__dirname, url.slice(1));
    const file = fs.readFileSync(p, 'utf-8');
    const content = `
      const css = '${file.replace(/\n/g, '')}'
      let link = document.createElement('style')
      link.setAttribute('type','text/css')
      document.head.appendChild(link)
      link.innerHTML = css
      export default css
    `;
    ctx.type = 'application/javascript';
    ctx.body = content;
  }
  // }else if(url.endsWith('.scss')){}
  // }else if(url.endsWith('.less')){}
  // }else if(url.endsWith('.ts')){}
  else {
    ctx.body = 'body';
  }
});

app.listen(3001, () => {
  console.log('3001');
});
