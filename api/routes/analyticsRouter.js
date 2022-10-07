module.exports = app => {
    const router = require("express").Router();
    const analytics_controller = require("../controllers/analyticsController");
    
    router.get("/test", analytics_controller.test_api);
    router.get("/healthz", analytics_controller.health_check);
    router.get("/classes", analytics_controller.get_classes);
    router.get("/classes/:id", analytics_controller.get_class);
    
    app.use('/v1', router)
}