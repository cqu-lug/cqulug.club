---
title: "重庆大学 Atrust VPN 使用指南"
permalink: /wiki/atrust/
categories:
  - Wiki
tags:
  - Wiki
  - VPN
---

> Atrust VPN 是重庆大学为校内师生提供的访问校内资源的服务，主要用于在校外访问校内网络资源，详细信息请查看[信息办官网介绍](https://net.cqu.edu.cn/info/1015/2899.htm)

您可将直接将需要转换的 URL 粘贴至下方输入框，点击“跳转”按钮即可自动通过 Atrust VPN访问对应的资源。

{% include atrust-redirector.html %}

##### 转换公式
`协议://主机名.域名:端口/路径`  
→
`https://主机名-域名-端口-p-协议后缀.atrust.cqu.edu.cn/路径`

##### 转换示例
`https://login.cqu.edu.cn:802/eportal`

| 步骤 | 操作                          | 结果 |
|------|-------------------------------|------|
| 1 | Atrust VPN 必须为 HTTPS       | `https://` |
| 2 | 主机名中的 `.` 替换为 `-`     | `login-cqu-edu-cn` |
| 3 | 端口号前加 `-`，后加 `-p`     | `-802-p` |
| 4 | 如为 HTTPS 协议，加 `-s` 后缀 | `-s` |
| 5 | 拼接 VPN 域名                 | `.atrust.cqu.edu.cn` |
| 6 | 保留原路径                    | `/eportal` |

`https://login-cqu-edu-cn-802-p-s.atrust.cqu.edu.cn/eportal`

以下是一些示例：
```
- https://mirrors.cqu.edu.cn -> https://mirrors-cqu-edu-cn-s.atrust.cqu.edu.cn
- http://lanunion.cqu.edu.cn/about -> https://lanunion-cqu-edu-cn.atrust.cqu.edu.cn/about
- http://10.10.8.162 -> https://10-10-8-162.atrust.cqu.edu.cn
```
