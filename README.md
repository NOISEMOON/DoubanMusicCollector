## Updates
### 2024-07-11 
- Manifest 升级到了 V3，避免 V2 版本的过期问题：https://developer.chrome.com/docs/extensions/develop/migrate/mv2-deprecation-timeline?hl=zh-cn
- 增加了自动识别 Spotify 专辑类型的功能

## Introduction
在以下两个项目的基础上，增加了通过 Spotify 添加音乐条目的功能：
- https://github.com/Sneexy/DoubanAddCloudMusicHelper
- https://github.com/zeqianli/DoubanListingHelper

## Usage

1. 在本页面点击 Code -> Download ZIP，下载 zip 文件到本地并解压，在 Chrome 浏览器中加载解压后的插件
2. 在 Spotify 客户端中点击分享，复制 Album Link
3. 访问 Spotify for Developers 并登录：https://developer.spotify.com/documentation/web-api/reference/get-an-album
4. 在 id 中输入 album id，例如：`https://open.spotify.com/album/449cSwxW2mczsRKAV8BetQ?si=cCZ287s4SD6seUCIFXLEEA` 中的 `449cSwxW2mczsRKAV8BetQ`
5. 点击 Try it，等待下方 Response 更新
6. 点击左上角的 Collect
7. 跳转到豆瓣音乐，检查信息填写有无错误，进入下一步，手动上传图片

## Contact
有任何使用问题请私信我，我会及时更新此插件：
- douban: https://www.douban.com/people/araell/
- weibo: https://weibo.com/u/7383494480