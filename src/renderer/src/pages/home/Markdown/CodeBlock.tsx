import { CheckOutlined, DownOutlined, RightOutlined } from '@ant-design/icons'
import CopyIcon from '@renderer/components/Icons/CopyIcon'
import { useSyntaxHighlighter } from '@renderer/context/SyntaxHighlighterProvider'
import { useSettings } from '@renderer/hooks/useSettings'
import React, { memo, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import Artifacts from './Artifacts'
import Mermaid from './Mermaid'

interface CodeBlockProps {
  children: string
  className?: string
  [key: string]: any
}

const CollapseIcon: React.FC<{ expanded: boolean; onClick: () => void }> = ({ expanded, onClick }) => {
  return (
    <CollapseIconWrapper onClick={onClick}>
      {expanded ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}
    </CollapseIconWrapper>
  )
}

const ExpandButton: React.FC<{
  isExpanded: boolean
  onClick: () => void
  showButton: boolean
}> = ({ isExpanded, onClick, showButton }) => {
  if (!showButton) return null

  return (
    <ExpandButtonWrapper onClick={onClick}>
      <div className="button-text">{isExpanded ? '收起' : '展开'}</div>
    </ExpandButtonWrapper>
  )
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children, className }) => {
  const match = /language-(\w+)/.exec(className || '')
  const showFooterCopyButton = children && children.length > 500
  const { codeShowLineNumbers, fontSize, codeCollapsible } = useSettings()
  const language = match?.[1] ?? 'text'
  const [html, setHtml] = useState<string>('')
  const { codeToHtml } = useSyntaxHighlighter()
  const [isExpanded, setIsExpanded] = useState(!codeCollapsible)
  const [shouldShowExpandButton, setShouldShowExpandButton] = useState(false)
  const codeContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadHighlightedCode = async () => {
      const highlightedHtml = await codeToHtml(children, language)
      setHtml(highlightedHtml)
    }
    loadHighlightedCode()
  }, [children, language, codeToHtml])

  useEffect(() => {
    if (codeContentRef.current) {
      setShouldShowExpandButton(codeContentRef.current.scrollHeight > 350)
    }
  }, [html])

  useEffect(() => {
    if (!codeCollapsible) {
      setIsExpanded(true)
      setShouldShowExpandButton(false)
    } else {
      setIsExpanded(!codeCollapsible)
      if (codeContentRef.current) {
        setShouldShowExpandButton(codeContentRef.current.scrollHeight > 350)
      }
    }
  }, [codeCollapsible])

  if (language === 'mermaid') {
    return <Mermaid chart={children} />
  }

  return match ? (
    <div className="code-block">
      <CodeHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {codeCollapsible && <CollapseIcon expanded={isExpanded} onClick={() => setIsExpanded(!isExpanded)} />}
          <CodeLanguage>{'<' + match[1].toUpperCase() + '>'}</CodeLanguage>
        </div>
        <CopyButton text={children} />
      </CodeHeader>
      <CodeContent
        ref={codeContentRef}
        isShowLineNumbers={codeShowLineNumbers}
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          border: '0.5px solid var(--color-code-background)',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          marginTop: 0,
          fontSize: fontSize - 1,
          maxHeight: codeCollapsible && !isExpanded ? '350px' : 'none',
          overflow: codeCollapsible && !isExpanded ? 'auto' : 'visible',
          position: 'relative'
        }}
      />
      {codeCollapsible && (
        <ExpandButton
          isExpanded={isExpanded}
          onClick={() => setIsExpanded(!isExpanded)}
          showButton={shouldShowExpandButton}
        />
      )}
      {showFooterCopyButton && (
        <CodeFooter>
          <CopyButton text={children} style={{ marginTop: -40, marginRight: 10 }} />
        </CodeFooter>
      )}
      {language === 'html' && children?.includes('</html>') && <Artifacts html={children} />}
    </div>
  ) : (
    <code className={className}>{children}</code>
  )
}

const CopyButton: React.FC<{ text: string; style?: React.CSSProperties }> = ({ text, style }) => {
  const [copied, setCopied] = useState(false)
  const { t } = useTranslation()

  const onCopy = () => {
    navigator.clipboard.writeText(text)
    window.message.success({ content: t('message.copied'), key: 'copy-code' })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return copied ? (
    <CheckOutlined style={{ color: 'var(--color-primary)', ...style }} />
  ) : (
    <CopyIcon className="copy" style={style} onClick={onCopy} />
  )
}

const CodeContent = styled.div<{ isShowLineNumbers: boolean }>`
  .shiki {
    padding: 1em;
  }

  ${(props) =>
    props.isShowLineNumbers &&
    `
      code {
        counter-reset: step;
        counter-increment: step 0;
      }

      code .line::before {
        content: counter(step);
        counter-increment: step;
        width: 1rem;
        margin-right: 1rem;
        display: inline-block;
        text-align: right;
        opacity: 0.35;
      }
    `}
`

const CodeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-text);
  font-size: 14px;
  font-weight: bold;
  height: 34px;
  padding: 0 10px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  .copy {
    cursor: pointer;
    color: var(--color-text-3);
    transition: color 0.3s;
  }
  .copy:hover {
    color: var(--color-text-1);
  }
`

const CodeLanguage = styled.div`
  font-weight: bold;
`

const CodeFooter = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  .copy {
    cursor: pointer;
    color: var(--color-text-3);
    transition: color 0.3s;
  }
  .copy:hover {
    color: var(--color-text-1);
  }
`

const ExpandButtonWrapper = styled.div`
  position: relative;
  cursor: pointer;
  height: 30px;
  margin-top: -30px;

  .button-text {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    padding: 8px;
    color: var(--color-text-3);
    z-index: 1;
    transition: color 0.2s;
    font-size: 12px;
  }

  &:hover .button-text {
    color: var(--color-text-1);
  }
`

const CollapseIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text-3);
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--color-background-soft);
    color: var(--color-text-1);
  }
`

export default memo(CodeBlock)
