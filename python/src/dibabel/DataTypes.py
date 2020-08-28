from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Set, Optional


@dataclass
class WdSitelink:
    qid: str
    domain: str
    title: str


@dataclass
class TitleSitelinks:
    qid: Optional[str]
    normalizedTitle: str
    # missing     - page does not exist at mediawiki.org
    # sync        - page is enabled for multi-site synchronization
    # manual_sync - page is specially tagged as synced by hand (e.g. Template:Documentation)
    # no_sync     - page is in Wikidata, but not marked for any type of syncing
    # no_wd       - page exists but does not have a wikidata entry
    pageType: str  # 'missing' | 'sync' | 'manual_sync' | 'no_sync' | 'no_wd'
    domain_to_title: Dict[str, str]


# Any title (could be non-normalized or even a redirect) to a sitelink map
TitleSitelinksCache = Dict[str, TitleSitelinks]


@dataclass
class WdWarning:
    qid: str
    url: str


@dataclass
class SiteMetadata:
    last_updated: datetime
    magic_words: Set[str]
    magic_prefixes: Set[str]
    flagged_revisions: bool
    template_ns: str
    module_ns: str

    def is_magic_keyword(self, name: str):
        return name in self.magic_words or any(v for v in self.magic_prefixes if name.startswith(v))


@dataclass
class RevComment:
    user: str
    ts: str
    comment: str
    content: str
    revid: int


@dataclass
class SyncInfo:
    status: str  # 'ok' | 'outdated' | 'unlocalized' | 'diverged' | 'new'
    qid: str
    src_title: str
    dst_domain: str
    dst_title: str
    dst_timestamp: Optional[str] = None
    dst_protection: Optional[List[str]] = None
    dst_revid: Optional[int] = None
    new_content: Optional[str] = None
    behind: Optional[int] = None
    matched_revid: Optional[int] = None
    hash: Optional[str] = None

    def __str__(self) -> str:
        return f"{self.status}: {self.src_title} -> {self.dst_domain}/wiki/{self.dst_title} " \
               f"({self.dst_revid}, #{self.hash})"


Timestamp = str

Translations = Dict[str, Dict[str, str]]
