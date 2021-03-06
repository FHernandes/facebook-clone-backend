const User = require("../models/User");
const Post = require("../models/Post");
const router = require("express").Router();
const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "./uploads");
    },
    filename: (req, file, callback) => {
        callback(null,file.originalname);
        // callback(null, new Date().toISOString() + file.originalname);
    }
})

const upload = multer({ storage: storage });

//upload image
router.post("/upload", upload.single("file"), (req, res) => {
    return res.status(200).json({image: `http://localhost:8000/static/${req.file.filename}`});
});

// create a post
router.post("/", async (req, res) => {
    const newPost = new Post(req.body);

    try {
        const savedPost = await newPost.save();
        res.status(200).json(savedPost);
    } catch (err) {
        res.status(500).json(err);
    }
});

// update a post
router.put("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (post.userId === req.body.userId) {
            await post.updateOne({ $set: req.body });
            res.status(200).json("the post has been updated");
        } else {
            res.status(403).json("you just can update your post");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// delete a post
router.delete("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (post.userId === req.body.userId) {
            await post.deleteOne();
            res.status(200).json("the post has been deleted");
        } else {
            res.status(403).json("you just can delete your post");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// post reaction
router.put("/:id/like", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post.likes.includes(req.body.userId)) {
            await post.updateOne({ $push: { likes: req.body.userId } });
            res.status(200).json("The post has been liked");
        } else {
            await post.updateOne({ $pull: { likes: req.body.userId } });
            res.status(200).json("The post has been disliked");
        }
    } catch (err) {
        res.status(500).json(err);
    }
})

// get a post
router.get("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        res.status(200).json(post);
    } catch (err) {
        res.status(500).json(err);
    }
});

// get timeline posts
router.get("/timeline/all", async (req, res) => {
    try {
        const currentUser = await User.findById("625c394e6a5b69fda867b24f");
        const userPosts = await Post.find({ userId: currentUser._id });
        const friendPosts = await Promise.all(
            currentUser.followings.map((friendId) => {
                return Post.find({ userId: friendId });
            })
        );
        res.json(userPosts.concat(...friendPosts))
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});

module.exports = router;