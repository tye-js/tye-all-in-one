#!/usr/bin/env node

const https = require('https');
const http = require('http');

// 测试 SSR 性能和 SEO 优化
async function testSSRPerformance() {
  const testUrl = 'http://localhost:3000/articles/comprehensive-test-article-ssr';
  
  console.log('🚀 Testing Server-Side Rendering Performance...\n');
  
  try {
    const startTime = Date.now();
    
    // 获取页面内容
    const html = await fetchPage(testUrl);
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    console.log(`⏱️  Page Load Time: ${loadTime}ms`);
    
    // 分析 HTML 内容
    analyzeHTML(html);
    
  } catch (error) {
    console.error('❌ Error testing SSR:', error.message);
  }
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
      
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function analyzeHTML(html) {
  console.log('\n📊 SEO and SSR Analysis:');
  console.log('=' .repeat(50));
  
  // 检查基本 SEO 元素
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descriptionMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
  const keywordsMatch = html.match(/<meta[^>]*name="keywords"[^>]*content="([^"]+)"/i);
  
  console.log(`📝 Title: ${titleMatch ? '✅ Found' : '❌ Missing'}`);
  if (titleMatch) {
    console.log(`    "${titleMatch[1]}"`);
  }
  
  console.log(`📄 Description: ${descriptionMatch ? '✅ Found' : '❌ Missing'}`);
  if (descriptionMatch) {
    console.log(`    "${descriptionMatch[1].substring(0, 100)}..."`);
  }
  
  console.log(`🏷️  Keywords: ${keywordsMatch ? '✅ Found' : '❌ Missing'}`);
  if (keywordsMatch) {
    console.log(`    "${keywordsMatch[1]}"`);
  }
  
  // 检查 Open Graph 标签
  const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
  const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i);
  const ogTypeMatch = html.match(/<meta[^>]*property="og:type"[^>]*content="([^"]+)"/i);
  
  console.log(`\n🌐 Open Graph Tags:`);
  console.log(`    og:title: ${ogTitleMatch ? '✅ Found' : '❌ Missing'}`);
  console.log(`    og:description: ${ogDescMatch ? '✅ Found' : '❌ Missing'}`);
  console.log(`    og:type: ${ogTypeMatch ? '✅ Found' : '❌ Missing'}`);
  
  // 检查文章内容是否在服务端渲染
  const articleContentMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const headingsCount = (html.match(/<h[1-6][^>]*>/gi) || []).length;
  const paragraphsCount = (html.match(/<p[^>]*>/gi) || []).length;
  const codeBlocksCount = (html.match(/<pre[^>]*>/gi) || []).length;
  
  console.log(`\n📖 Content Analysis:`);
  console.log(`    Article content: ${articleContentMatch ? '✅ Server-rendered' : '❌ Missing'}`);
  console.log(`    Headings (h1-h6): ${headingsCount} found`);
  console.log(`    Paragraphs: ${paragraphsCount} found`);
  console.log(`    Code blocks: ${codeBlocksCount} found`);
  
  // 检查结构化数据
  const structuredDataMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>/i);
  console.log(`    Structured data: ${structuredDataMatch ? '✅ Found' : '⚠️  Not found'}`);
  
  // 检查标题 ID（用于目录导航）
  const headingIdsCount = (html.match(/<h[1-6][^>]*id="[^"]+"/gi) || []).length;
  console.log(`    Heading IDs (for TOC): ${headingIdsCount} found`);
  
  // 检查客户端组件占位符
  const tocPlaceholder = html.includes('table-of-contents-placeholder');
  const shareButtons = html.includes('share-buttons');
  const bookmarkButton = html.includes('bookmark-button');
  
  console.log(`\n🎯 Client-Side Integration:`);
  console.log(`    TOC placeholder: ${tocPlaceholder ? '✅ Found' : '❌ Missing'}`);
  console.log(`    Share buttons placeholder: ${shareButtons ? '✅ Found' : '❌ Missing'}`);
  console.log(`    Bookmark button placeholder: ${bookmarkButton ? '✅ Found' : '❌ Missing'}`);
  
  // 计算内容大小
  const htmlSize = Buffer.byteLength(html, 'utf8');
  const contentSize = articleContentMatch ? Buffer.byteLength(articleContentMatch[1], 'utf8') : 0;
  
  console.log(`\n📏 Size Analysis:`);
  console.log(`    Total HTML size: ${(htmlSize / 1024).toFixed(2)} KB`);
  console.log(`    Article content size: ${(contentSize / 1024).toFixed(2)} KB`);
  console.log(`    Content ratio: ${((contentSize / htmlSize) * 100).toFixed(1)}%`);
  
  // 性能评分
  let score = 0;
  let maxScore = 0;
  
  // SEO 基础 (30分)
  maxScore += 30;
  if (titleMatch) score += 10;
  if (descriptionMatch) score += 10;
  if (keywordsMatch) score += 10;
  
  // Open Graph (20分)
  maxScore += 20;
  if (ogTitleMatch) score += 7;
  if (ogDescMatch) score += 7;
  if (ogTypeMatch) score += 6;
  
  // 内容渲染 (30分)
  maxScore += 30;
  if (articleContentMatch) score += 15;
  if (headingsCount > 0) score += 10;
  if (headingIdsCount > 0) score += 5;
  
  // 客户端集成 (20分)
  maxScore += 20;
  if (tocPlaceholder) score += 7;
  if (shareButtons) score += 7;
  if (bookmarkButton) score += 6;
  
  const finalScore = Math.round((score / maxScore) * 100);
  
  console.log(`\n🏆 SSR Quality Score: ${finalScore}/100`);
  
  if (finalScore >= 90) {
    console.log('🎉 Excellent! Your SSR implementation is top-notch.');
  } else if (finalScore >= 80) {
    console.log('👍 Good! Minor improvements could be made.');
  } else if (finalScore >= 70) {
    console.log('⚠️  Fair. Some important features are missing.');
  } else {
    console.log('❌ Poor. Significant improvements needed.');
  }
  
  console.log('\n' + '='.repeat(50));
}

// 运行测试
testSSRPerformance();
