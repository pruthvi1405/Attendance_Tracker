# app.py - entrypoint
import os
from flask import Flask, jsonify
from dotenv import load_dotenv
from flask_cors import CORS

# load instance/.env or .env
load_dotenv()

def create_app(config_object=None):
    app = Flask(__name__, instance_relative_config=True)
    CORS(app,supports_credentials=True) 
    # default config
    app.config.from_object("config.DefaultConfig")

    # instance config override (optional)
    instance_cfg = os.path.join(app.instance_path, "config.py")
    if os.path.exists(instance_cfg):
        app.config.from_pyfile("config.py")

    # optional programmatic config override
    if config_object:
        app.config.from_object(config_object)

    # initialize extensions and blueprints
    from attendance.database import db, migrate
    db.init_app(app)
    migrate.init_app(app, db)

    # register blueprints
    from attendance.routes.auth_routes import auth_bp
    from attendance.routes.user_routes import user_bp
    from attendance.routes.admin_routes import admin_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(user_bp)
    app.register_blueprint(admin_bp, url_prefix="/admin")

    # generic error handler for JSON
    @app.errorhandler(Exception)
    def handle_unexpected(err):
        # If it's an HTTPException, it has code attribute
        try:
            code = err.code
        except AttributeError:
            code = 500
        response = {"error": str(err)}
        return jsonify(response), code

    return app

if __name__ == "__main__":
    app = create_app()
    # create tables in dev if not existing
    with app.app_context():
        from attendance.database import db
        db.create_all()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
