import React, { useEffect, useState } from 'react';

import {
  EuiButton,
  EuiCallOut,
  EuiCodeBlock,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiLink,
  EuiProgress,
  EuiSpacer,
  EuiText,
  EuiTitle,
  useEuiTextDiff
} from '@elastic/eui';

import { Item } from '../data/types';
import { ItemDiffLink, ItemDstLink, ItemSrcLink, ItemWikidataLink, ProjectIcon } from './Snippets';
import { rootUrl } from '../utils';

interface ItemViewerParams<TItem> {
  item: TItem;
  onClose: (
    event?:
      | React.KeyboardEvent<HTMLDivElement>
      | React.MouseEvent<HTMLButtonElement>
  ) => void
}

const ItemDiffBlock = ({ type, oldText, newText }: { type: string, oldText: string, newText: string }) => {
  const [rendered] = useEuiTextDiff({
    beforeText: oldText,
    afterText: newText,
    timeout: 0.5,
  });
  return <EuiCodeBlock language={type === 'module' ? 'lua' : 'text'}>{rendered}</EuiCodeBlock>;
};

const Comment = () => {
  const [value, setValue] = useState('');

  const onChange = (e: any) => {
    setValue(e.target.value);
  };

  return (<EuiFieldText
    placeholder={'Edit summary'}
    isInvalid={!value.trim()}
    value={value}
    onChange={e => onChange(e)}
    aria-label={'Edit summary'}
    fullWidth={true}
  />);
};

const ItemDiffViewer = ({ onClose, item }: ItemViewerParams<Item>) => {

  const [content, setContent] = useState<React.ReactElement | undefined>();

  useEffect(() => {
    (async () => {
      let newContent;
      try {
        const result = await fetch(`${rootUrl}page/${item.qid}/${item.dstSite}`);
        if (result.ok) {
          let data = await result.json();
          newContent = (<ItemDiffBlock type={item.type} oldText={data.currentText} newText={data.newText}/>);
        } else {
          const msg = `Unable to get the page. ${result.status}: ${result.statusText}\n${await result.text()}`;
          newContent = (<EuiCallOut title="Error loading content..." color="danger" iconType="alert">
            <p>{msg}</p>
          </EuiCallOut>);
        }
      } catch (err) {
        newContent = (<EuiCallOut title="Error loading content..." color="danger" iconType="alert">
          <p>{err.toString()}</p>
        </EuiCallOut>);
      }
      setContent(newContent);
    })();
  }, [item]);

  const body = content ?? (<EuiProgress size="s" color="accent" label={'Loading page content...'}/>);

  let infoSubHeader;
  switch (item.status) {
    case 'diverged':
      infoSubHeader = (
        <EuiText>The current version of{' '}<ItemDstLink item={item}/>{' '}({item.dstSite}) was not found in the history
          of the primary page <ItemSrcLink item={item}/>.</EuiText>);
      break;
    case 'outdated':
      infoSubHeader = (
        <EuiText>Page{' '}<ItemDstLink item={item}/>{' '}({item.dstSite}) is{' '}<ItemDiffLink
          item={item}>{item.behind} revisions</ItemDiffLink>{' '}behind the
          primary{' '}<ItemSrcLink item={item}/>.</EuiText>);
      break;
    case 'unlocalized':
      infoSubHeader = (
        <EuiText>Page{' '}<ItemDstLink item={item}/>{' '}({item.dstSite}) is identical with the original <ItemSrcLink
          item={item}/>, but needs to have some localizations.</EuiText>);
      break;
    default:
      throw new Error(`Unhandled ${item.status}`);
  }

  function formatLinks(site: string, links: Array<string>) {
    return (<ul>
      {links.map(el => (<li><EuiLink href={`https://${site}/wiki/${el}`} target="_blank">{el}</EuiLink></li>))}
    </ul>);
  }

  const warnings = [];
  if (item.not_multisite_deps) {
    warnings.push(<EuiSpacer size={'m'}/>);
    warnings.push(<EuiCallOut title="Dependencies are not enabled for synchronization" color="warning" iconType="alert">
      <EuiText>This page depends on templates or modules that have not been tagged as "multi-site" in Wikidata.
        Most of the time this means that page <ItemSrcLink item={item}/> is not yet ready for synchronization, and
        should not have a multi-site type in <ItemWikidataLink item={item}/>. Alternatively it could also mean that the
        page was edited to use a new template/module, and that the new page is not enabled for
        synchronization.</EuiText>
      <EuiSpacer size={'s'}/>
      <EuiText>{formatLinks(item.dstSite, item.not_multisite_deps)}</EuiText>
    </EuiCallOut>);
  }
  if (item.multisite_deps_not_on_dst) {
    warnings.push(<EuiSpacer size={'m'}/>);
    warnings.push(<EuiCallOut title={`Dependencies do not exist in ${item.dstSite}`} color="warning" iconType="alert">
      <EuiText>This page depends on templates or modules that are not present on the destination site. Copy
        the content of these pages to
        <EuiLink href={`https://${item.dstSite}`} target="_blank">{item.dstSite}</EuiLink> and make sure they are listed
        in the <ItemWikidataLink item={item}/>.</EuiText>
      <EuiSpacer size={'s'}/>
      <EuiText>{formatLinks(item.srcSite, item.multisite_deps_not_on_dst)}</EuiText>
    </EuiCallOut>);
  }

  return (
    <EuiFlyout
      ownFocus
      size={'l'}
      onClose={onClose}
      aria-labelledby="flyoutTitle">
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <EuiFlexGroup alignItems={'center'} gutterSize={'s'}>
            <EuiFlexItem grow={false}><ProjectIcon item={item} size={'xl'}/></EuiFlexItem>&nbsp;
            <h3>{item.srcFullTitle}</h3>
          </EuiFlexGroup>
        </EuiTitle>
        <EuiSpacer size={'s'}/>
        <EuiFlexItem grow={true}>{infoSubHeader}</EuiFlexItem>
        {warnings}
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        {body}
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent={'spaceBetween'} alignItems={'center'}>
          <EuiFlexItem grow={false}>
            <EuiText>Summary:</EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={true}>
            <Comment/>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton color={'danger'} onClick={onClose} fill>
              Copy!
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
};

export const ItemViewer = (props: ItemViewerParams<Item | null | undefined>) => {
  // ItemDiffViewer must be wrapped because it uses a hook
  if (!props.item) {
    return null;
  }
  // TODO?  seems like a weird way to force nullable into a non-nullable .item type
  return <ItemDiffViewer {...(props as ItemViewerParams<Item>)} />;
};
