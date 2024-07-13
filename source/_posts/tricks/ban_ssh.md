---
title: ssh设置白名单，保护暴露在公网的端口
categories:
- tricks
tags:
- tricks
- ssh
---

## iptables+ipset

它们真的很烦，自从买的服务器后，ssh一直被暴力字典，虽然设置了只允许密钥登陆，ssh开到高端口，但是看到/var/log/auth.log每两分钟就有尝试登陆，还是很烦。

这次远程工作，要把4070ti暴露出来了，比较贵重，还是得加强一下防御，通过询问llm，知道了可以用iptables+ipset来设置白名单，这里记录一下，之后再换内网穿透服务器时，再建立一遍吧。

```bash
# 更新包列表并安装ipset工具，用于后续的IP集合管理
sudo apt update && sudo apt install ipset

# 创建一个名为cnip的IP集合，类型为网络哈希，用于存储中国IP地址
sudo ipset -N cnip hash:net 

# 从ipdeny.com下载中国IP地址的zone文件
wget http://www.ipdeny.com/ipblocks/data/countries/cn.zone 

# 遍历cn.zone文件中的每一行，将IP地址添加到cnip集合中
for i in `cat cn.zone`; do sudo ipset -A cnip $i; done 

# 查看ipset中的IP集合，确认中国IP地址是否已正确添加
# ipset -L

# 设置iptables规则，允许来自cnip集合中IP地址的入站流量
sudo iptables -I INPUT -m set --match-set cnip src -j ACCEPT

# 将默认的入站策略设置为DROP，即拒绝所有未明确允许的入站流量
sudo iptables -P INPUT DROP 
```

以上注释由通义灵码生成，赞美它。

## 看看效果

在我写这个博客前，还在以3分钟左右为单位，不停地被暴力，我们现在再来看看log吧，现在是17:49，/var/log/auth.log的最后是：

```
Jul 13 17:26:40 localhost sshd[9105]: Invalid user ixm from 45.148.10.197 port 38550
Jul 13 17:26:40 localhost sshd[9105]: Connection closed by invalid user ixm 45.148.10.197 port 38550 [preauth]
Jul 13 17:28:16 localhost sshd[9107]: Invalid user bvl from 142.93.164.120 port 38148
Jul 13 17:28:16 localhost sshd[9107]: Connection closed by invalid user bvl 142.93.164.120 port 38148 [preauth]
Jul 13 17:29:22 localhost sshd[9109]: Invalid user txw from 45.148.10.196 port 52144
Jul 13 17:29:23 localhost sshd[9109]: Connection closed by invalid user txw 45.148.10.196 port 52144 [preauth]
Jul 13 17:31:08 localhost sudo: pam_unix(sudo:session): session closed for user root
Jul 13 17:35:01 localhost CRON[9193]: pam_unix(cron:session): session opened for user root by (uid=0)
Jul 13 17:35:01 localhost CRON[9193]: pam_unix(cron:session): session closed for user root
Jul 13 17:40:01 localhost CRON[9205]: pam_unix(cron:session): session opened for user root by (uid=0)
Jul 13 17:40:01 localhost CRON[9205]: pam_unix(cron:session): session closed for user root
Jul 13 17:45:01 localhost CRON[9214]: pam_unix(cron:session): session opened for user root by (uid=0)
Jul 13 17:45:01 localhost CRON[9214]: pam_unix(cron:session): session closed for user root
Jul 13 17:50:01 localhost CRON[9225]: pam_unix(cron:session): session opened for user root by (uid=0)
Jul 13 17:50:01 localhost CRON[9225]: pam_unix(cron:session): session closed for user root
```

可以看到，17:30以后，就只有计划任务了，终于能安静点了。之前一直没管，日志文件都积累了快100M了，真是操蛋。

之前在B站也看到了做ssh蜜罐服务的帖子，不过咱这小水管，懒得折腾了。