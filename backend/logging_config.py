import logging
import json
import time

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "filename": record.filename,
            "line_number": record.lineno,
        }
        # Include exception traceback if present
        if record.exc_info:
            log_data["traceback"] = self.formatException(record.exc_info)
            
        # Include extra attributes passed to logger
        if hasattr(record, "extra_data"):
            log_data["extra"] = record.extra_data
            
        return json.dumps(log_data)

def setup_logging():
    # Root logger configuration
    root_logger = logging.getLogger()
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
        
    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(JsonFormatter())
    
    root_logger.addHandler(console_handler)
    root_logger.setLevel(logging.INFO)
    
    # Mute noisy third-party libraries slightly
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

# Helper to log security/business events
logger = logging.getLogger("behavioredge.security")

def log_auth_event(success: bool, user_identifier: str, ip: str, detail: str = None):
    event_data = {
        "event_type": "authentication",
        "status": "success" if success else "failed",
        "username_or_email": user_identifier,
        "client_ip": ip,
        "detail": detail
    }
    logger.info(
        f"Auth event: {event_data['status']} for user {user_identifier}", 
        extra={"extra_data": event_data}
    )

def log_system_error(error_msg: str, endpoint: str, ip: str, exc_info=None):
    event_data = {
        "event_type": "system_error",
        "endpoint": endpoint,
        "client_ip": ip
    }
    logger.error(
        f"System error at {endpoint}: {error_msg}",
        exc_info=exc_info,
        extra={"extra_data": event_data}
    )
