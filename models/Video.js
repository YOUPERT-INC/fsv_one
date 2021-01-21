var mongoose = require('mongoose');

// Video Model Schema
var VideoSchema = new mongoose.Schema({
    code: String,
    video_url: String,
    title: String,
    is_active: { type: Number, default: 1 },
    updated_time: String,
    created_time: String,
    img_url: String
}, {
	timestamps: true, collection: 'pexels'
});

module.exports = mongoose.model('Video', VideoSchema);
