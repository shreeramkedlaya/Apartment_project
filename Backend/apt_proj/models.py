# This file aggregates all models from the domain folders
# so that Django's migration engine registers them to the `apt_proj` app.

from .Apt_Accounts.Accounts_models import UserProfile, Block, Flat
from .Apt_Issues.Issue_models import Issue, IssueTimeline
from .Apt_Notices.Notices_models import Notice, NoticeAttachment, NoticeApproval, NoticeAcknowledgement

__all__ = [
    "UserProfile",
    "Block",
    "Flat",
    "Issue",
    "IssueTimeline",
    "Notice",
    "NoticeAttachment",
    "NoticeApproval",
    "NoticeAcknowledgement"
]
