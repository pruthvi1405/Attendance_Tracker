from typing import Optional

def seconds_to_human(sec: Optional[int]) -> Optional[str]:
    if sec is None:
        return None
    hours = sec // 3600
    minutes = (sec % 3600) // 60
    return f"{hours}h {minutes}m"
