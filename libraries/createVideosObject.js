const { isEmpty } = require("lodash")
let config = require('../config/config');

// Create and Return Video Object
function createVideosObject(video) {
    let videoObj = {}
    videoObj._id = video._id ? video._id : '';
    videoObj.code = video.code ? video.code : '';
    videoObj.video_url = video.video_url ? video.video_url : '';
    videoObj.title = video.title ? video.title : "";
    videoObj.is_active = video.is_active ? video.is_active : 0;
    videoObj.updated_time = video.updated_time ? video.updated_time : 0;
    videoObj.created_time = video.created_time ? video.created_time : '';
    videoObj.img_url = video.img_url ? video.img_url : '';
    return videoObj;
}

module.exports = createVideosObject;