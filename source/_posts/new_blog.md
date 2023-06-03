---
title: Hexo + Github Page部署博客
tags:
- 教程
- 文档
---

写了蛮多博客了，已经，一直放在master里，感觉不够cool，这周六想起来，好像github提供免费的静态网页托管服务，不用自己的服务器和域名，很不错，准备搞搞，以便之后的博客能比较cool地展示出去。本文是教程。

笔者的环境是wsl-ubuntu，毫无前端开发经验，故也包含nodejs等的安装配置环节，非常适合和我一样，在前端方面一无所知的朋友们参考经验。

让我们开始吧！
<!--more-->

## 安装nodejs && npm换源

hexo要求nodejs 14，但是apt install nodejs目前得到的是10版本，我们需要额外添加源：

```sh
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install nodejs -y
# npm换源tb.
npm config set registry https://registry.npm.taobao.org
```

## 安装 Hexo

Hexo提供快捷的博客前端解决方案，下下来就能用了。

```
sudo npm install -g hexo-cli
hexo init blog
cd blog
npm install
```

到这里，由于我们已经有了nodejs作为服务器，hexo提供了前端工程，我们已经可以直接将它运行起来了。

```sh
hexo s
```

这将在localhost:4000运行服务器，代理前端页面。

## 更换主题

来都来了，用默认主题实在太不coooool了，我们换一个好看的。

我问了问NewBing，newbing说Next这个主题很受欢迎，我看了一下确实还行，[Next主页](https://github.com/next-theme/hexo-theme-next)

```sh
# clone into theme folder:
git clone git@github.com:next-theme/hexo-theme-next.git themes/next
# change nexo sheme to next.
sed -i 's/theme: landscape/theme: next/g' _config.yml
```

Next自己也提供四种风格变种供我们使用，我们选择Gemini，这种风格在多个blog之间的划分明显，更清晰，也更沉稳，非常coooooool。手动打开themes/next/_config.yml修改吧！人不要太懒了。

其他的配置，有的没的，next提供了许多选择，可以参考 [next仓库](https://github.com/next-theme/hexo-theme-next/tree/master) 看看。  

我也稍微做了一些调整，遗憾的是，不能做的非常漂亮，指哪打哪，对前端还是不了解，我想要的标题字体加粗，字体阴影和选中字体颜色方案都不太好调整。  

## 发布到GitHub Pages

这里主要参考[hexo文档](https://hexo.io/zh-cn/docs/github-pages)的说明去做，需要注意的是，hexo给了一个GitHub-action的xml，GitHub自己也提供了方便添加的action。建议用hexo给的。



