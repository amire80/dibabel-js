import React, { Dispatch, useContext, useState } from 'react';
import {
  EuiBasicTableColumn,
  EuiCheckbox,
  EuiHealth,
  EuiIcon,
  EuiIconTip,
  EuiInMemoryTable,
  EuiInMemoryTableProps,
  EuiText,
  EuiToolTip
} from '@elastic/eui';

import { Group, Item } from '../types';
import { iconsEuiMedium, lockIcon } from '../icons/icons';
import { ExternalLink } from './Snippets';
import { itemDiffLink, prettyDomain } from '../utils';
import { CurrentItemContext } from '../contexts/CurrentItem';
import { I18nContext } from '../contexts/I18nContext';
import { SettingsContext } from '../contexts/Settings';
import { Message } from './Message';

export const ItemsTable = (
  { error, groupedItems, isLoading, message, selectedItems, setSelectedItems }: {
    isLoading: boolean,
    message: string,
    error?: string,
    groupedItems: any,
    selectedItems: Set<Item>,
    setSelectedItems: Dispatch<Set<Item>>,
  }
) => {
  const { languageNames } = useContext(SettingsContext);
  const { i18n } = useContext(I18nContext);
  const { setCurrentItem } = useContext(CurrentItemContext);

  const all_columns: { [key: string]: EuiBasicTableColumn<Item> } = {
    selector: {
      name: '',
      width: '2em',
      render: (item: Group | Item) => {
        // @ts-ignore
        const items: Array<Item> = item.allSubItems ?? [item];
        const selectable = items.filter(v => v.behind && v.behind > 0);
        const selectedCount = selectable.filter(v => selectedItems.has(v)).length;
        const checked = selectedCount > 0 && selectable.length === selectedCount;
        const disabled = selectable.length === 0;
        const indeterminate = selectedCount > 0 && selectable.length > selectedCount;
        return (<EuiCheckbox
          id={`check-${item.key}`}
          checked={checked}
          disabled={disabled}
          indeterminate={indeterminate}
          onChange={() => {
            const clone = new Set(selectedItems);
            for (let itm of selectable) {
              if (selectedCount === 0) {
                clone.add(itm);
              } else {
                clone.delete(itm);
              }
            }
            setSelectedItems(clone);
          }}
        />);
      },
    },
    expander: {
      width: '2.5em',
      render: (item: Item) => (<EuiIcon type={expandedItems.has(item.key) ? 'arrowUp' : 'arrowDown'}/>),
    },
    protection: {
      field: 'protection',
      name: (<EuiIconTip
        type={lockIcon}
        size={'m'}
        color={'#C6C7C7'}
        content={i18n('dibabel-table-icons-protection--tooltip')}
      />),
      width: '2.2em',
      sortable: true,
      render: (rights: string) => rights ? (
        <EuiIconTip
          type={lockIcon}
          size={'m'}
          color={'#0078b8'}
          content={i18n('dibabel-table-icons-protection--rights', rights)}
        />) : '',
    },
    title: {
      field: 'srcFullTitle',
      name: (<EuiToolTip content={i18n('dibabel-table-header-primary--tooltip')}><Message
        id="dibabel-table-header-primary--label"/></EuiToolTip>),
      sortable: true,
      render: (_: string, item: Item) => (<>{iconsEuiMedium[item.type]}&nbsp;&nbsp;{item.srcFullTitle}<ExternalLink
        tooltip={i18n('dibabel-table-cell-primary--tooltip', item.srcFullTitle)}
        href={item.srcTitleUrl}/></>),
    },
    lang: {
      field: 'lang',
      name: (<EuiToolTip content={i18n('dibabel-table-header-language--tooltip')}><Message
        id="dibabel-table-header-language--label"/></EuiToolTip>),
      sortable: true,
      render: (lang: string) => {
        const name = languageNames[lang];
        return name ? `${lang} - ${name}` : lang;
      },
    },
    project: {
      field: 'project',
      name: (<EuiToolTip content={i18n('dibabel-table-header-project--tooltip')}><Message
        id="dibabel-table-header-project--label"/></EuiToolTip>),
      sortable: true,
      render: (_: string, item: Item) => (<>{iconsEuiMedium[item.project]}&nbsp;&nbsp;&nbsp;{item.project}</>),
    },
    wiki: {
      field: 'wiki',
      name: (<EuiToolTip
        content={i18n('dibabel-table-header-site--tooltip')}><EuiText>{i18n('dibabel-table-header-site--label')}</EuiText></EuiToolTip>),
      sortable: true,
      render: (_: string, item: Item) => (<>{iconsEuiMedium[item.project]}&nbsp;&nbsp;&nbsp;{item.wiki}</>),
    },
    dstTitle: {
      field: 'dstFullTitle',
      name: (<EuiToolTip content={i18n('dibabel-table-header-wikipage--tooltip')}><Message
        id="dibabel-table-header-wikipage--label"/></EuiToolTip>),
      sortable: true,
      render: (_: string, item: Item) => (<>{iconsEuiMedium[item.type]}&nbsp;&nbsp;{item.dstFullTitle}<ExternalLink
        tooltip={i18n('dibabel-table-header-wikipage--link', prettyDomain(item.lang, item.project), item.dstFullTitle)}
        href={item.dstTitleUrl}/></>),
    },
    hash: {
      field: 'hash',
      name: (<EuiToolTip content={i18n('dibabel-table-header-hash--tooltip')}
      ><Message id="dibabel-table-header-hash--label"/></EuiToolTip>),
      sortable: true,
      render: (hash: string) => (<EuiToolTip title={hash} content={i18n('dibabel-table-cell-hash--tooltip')}
      ><EuiText>{hash.substring(0, 7)}</EuiText></EuiToolTip>)
    },
    status: {
      field: 'sortStatus',
      name: (<EuiToolTip content={i18n('dibabel-table-header-status--tooltip')}><Message
        id="dibabel-table-header-status--label"/></EuiToolTip>),
      sortable: true,
      render: (_: string, item: Item) => {
        switch (item.status) {
          case 'ok':
            return (<EuiHealth
              title={i18n('dibabel-table-cell-status--ok--tooltip')}
              color={'success'}><Message id="dibabel-table-cell-status--ok-label"/></EuiHealth>);
          case 'unlocalized':
            return (<EuiHealth
              title={i18n('dibabel-table-cell-status--unlocalized-tooltip')}
              color={'warning'}><Message id="dibabel-table-cell-status--unlocalized-label"/></EuiHealth>);
          case 'outdated':
            return (
              <EuiHealth
                title={i18n('dibabel-table-cell-status--outdated-tooltip', item.behind)}
                color={'warning'}
              ><span><Message id="dibabel-table-cell-status--outdated-label" placeholders={[item.behind]}/><ExternalLink
                tooltip={i18n('dibabel-table-cell-status--outdated-link', item.behind, item.srcFullTitle)}
                href={itemDiffLink(item)}/></span></EuiHealth>);
          case 'diverged':
            return (
              <EuiHealth
                title={i18n('dibabel-table-cell-status--diverged-tooltip')}
                color={'danger'}><Message id="dibabel-table-cell-status--diverged-label"/></EuiHealth>);
          default:
            throw new Error(i18n('dibabel-table-cell-status--error-label', item.status));
        }
      },
    },
    countOk: {
      field: 'countOk',
      name: (<EuiToolTip content={i18n('dibabel-table-header-updated--tooltip')}><Message
        id="dibabel-table-header-updated--label"/></EuiToolTip>),
      sortable: true,
      render: (value: number) => {
        if (value > 0) {
          return <EuiHealth title={i18n('dibabel-table-cell-updated--tooltip', value)}
                            color={'success'}>{i18n('dibabel-table-pagecount', value)}</EuiHealth>;
        } else {
          return '-';
        }
      },
    },
    countUnlocalized: {
      field: 'countUnlocalized',
      name: (<EuiToolTip
        content={i18n('dibabel-table-header-unlocalized--tooltip')}><Message
        id="dibabel-table-header-unlocalized--label"/></EuiToolTip>),
      sortable: true,
      render: (value: number) => {
        if (value > 0) {
          return <EuiHealth
            title={i18n('dibabel-table-cell-unlocalized--tooltip', value)}
            color={'warning'}>{i18n('dibabel-table-pagecount', value)}</EuiHealth>;
        } else {
          return '-';
        }
      },
    },
    countOutdated: {
      field: 'countOutdated',
      name: (<EuiToolTip content={i18n('dibabel-table-header-outdated--tooltip')}><Message
        id="dibabel-table-header-outdated--label"/></EuiToolTip>),
      sortable: true,
      render: (value: number) => {
        if (value > 0) {
          return <EuiHealth title={i18n('dibabel-table-cell-outdated--tooltip', value)}
                            color={'warning'}>{i18n('dibabel-table-pagecount', value)}</EuiHealth>;
        } else {
          return '-';
        }
      },
    },
    countDiverged: {
      field: 'countDiverged',
      name: (<EuiToolTip content={i18n('dibabel-table-header-diverged--tooltip')}><Message
        id="dibabel-table-header-diverged--label"/></EuiToolTip>),
      sortable: true,
      render: (value: number) => {
        if (value > 0) {
          return <EuiHealth title={i18n('dibabel-table-cell-diverged--tooltip', value)}
                            color={'danger'}>{i18n('dibabel-table-pagecount', value)}</EuiHealth>;
        } else {
          return '-';
        }
      },
    },
  };

  const [expandedItems, setExpandedItems] = useState(() => new Set());

  function toggleExpandGroup(item: Item) {
    const clone = new Set(expandedItems);
    if (clone.has(item.key)) {
      clone.delete(item.key);
    } else {
      clone.add(item.key);
    }
    setExpandedItems(clone);
  }

  function createTable(groupedItems: any, isTop?: boolean) {
    const params: EuiInMemoryTableProps<Item> = {
      items: groupedItems.items,
      columns: groupedItems.columns.map((v: string) => all_columns[v]),
      itemId: 'key',
      sorting: true,
      pagination: {
        initialPageSize: 15,
        hidePerPageOptions: true,
      },
    };
    if (isTop) {
      params.loading = isLoading;
      params.message = message;
      params.error = error;
    } else {
      params.className = 'sub-table';
    }
    if (!groupedItems.isLastGroup) {
      params.isExpandable = true;
      params.itemIdToExpandedRowMap = {};
      for (let item of groupedItems.items) {
        if (expandedItems.has(item.key)) {
          params.itemIdToExpandedRowMap[item.key] = createTable(item);
        }
      }
      params.rowProps = (item: Item) => ({
        onClick: (v: any) => {
          if (v.target.nodeName !== 'INPUT' && v.target.nodeName !== 'A') {
            toggleExpandGroup(item);
          }
        }
      });
    } else {
      // noinspection JSUnusedGlobalSymbols
      params.rowProps = (item: Item) => ({
        onClick: (v: any) => {
          if (v.target.nodeName !== 'INPUT' && v.target.nodeName !== 'A') {
            setCurrentItem(item);
          }
        },
      });
    }
    return (<EuiInMemoryTable {...params} />);
  }

  return createTable(groupedItems, true);
};
