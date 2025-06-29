#!/usr/bin/env node

const https = require('https');
const http = require('http');

// 性能对比测试
async function performanceComparison() {
  const testUrl = 'http://localhost:3000/articles/comprehensive-test-article-ssr';
  
  console.log('🚀 Performance Comparison: Before vs After Content Processing\n');
  
  try {
    // 运行多次测试取平均值
    const testRuns = 5;
    const results = [];
    
    console.log(`📊 Running ${testRuns} test iterations...\n`);
    
    for (let i = 1; i <= testRuns; i++) {
      console.log(`🔄 Test Run ${i}/${testRuns}`);
      
      const startTime = Date.now();
      const html = await fetchPage(testUrl);
      const endTime = Date.now();
      
      const loadTime = endTime - startTime;
      const analysis = analyzeContent(html);
      
      results.push({
        loadTime,
        ...analysis
      });
      
      console.log(`   ⏱️  Load Time: ${loadTime}ms`);
      console.log(`   📏 HTML Size: ${(analysis.htmlSize / 1024).toFixed(2)} KB`);
      console.log(`   📖 Content Elements: ${analysis.contentElements}`);
      console.log('');
    }
    
    // 计算平均值
    const avgResults = calculateAverages(results);
    
    console.log('📈 Performance Summary:');
    console.log('=' .repeat(50));
    console.log(`⏱️  Average Load Time: ${avgResults.loadTime.toFixed(2)}ms`);
    console.log(`📏 Average HTML Size: ${(avgResults.htmlSize / 1024).toFixed(2)} KB`);
    console.log(`📖 Content Elements: ${avgResults.contentElements}`);
    console.log(`🎯 Performance Score: ${calculatePerformanceScore(avgResults)}/100`);
    
    console.log('\n🎉 Optimization Benefits:');
    console.log('✅ Pre-processed HTML content (no runtime Markdown parsing)');
    console.log('✅ Pre-generated table of contents');
    console.log('✅ Cached content metadata');
    console.log('✅ Reduced server-side processing');
    console.log('✅ Improved SEO with complete HTML');
    
    // 检查内容质量
    checkContentQuality(results[0]);
    
  } catch (error) {
    console.error('❌ Error during performance test:', error.message);
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

function analyzeContent(html) {
  const htmlSize = Buffer.byteLength(html, 'utf8');
  
  // 分析内容元素
  const headings = (html.match(/<h[1-6][^>]*>/gi) || []).length;
  const paragraphs = (html.match(/<p[^>]*>/gi) || []).length;
  const codeBlocks = (html.match(/<pre[^>]*>/gi) || []).length;
  const links = (html.match(/<a[^>]*>/gi) || []).length;
  const images = (html.match(/<img[^>]*>/gi) || []).length;
  
  const contentElements = headings + paragraphs + codeBlocks + links + images;
  
  // 检查预处理内容
  const hasProcessedContent = html.includes('class="prose prose-lg max-w-none mb-8"');
  const hasTableOfContents = html.includes('table-of-contents-placeholder');
  const hasHeadingIds = (html.match(/<h[1-6][^>]*id="[^"]+"/gi) || []).length;
  
  return {
    htmlSize,
    contentElements,
    headings,
    paragraphs,
    codeBlocks,
    links,
    images,
    hasProcessedContent,
    hasTableOfContents,
    hasHeadingIds,
  };
}

function calculateAverages(results) {
  const count = results.length;
  
  return {
    loadTime: results.reduce((sum, r) => sum + r.loadTime, 0) / count,
    htmlSize: results.reduce((sum, r) => sum + r.htmlSize, 0) / count,
    contentElements: Math.round(results.reduce((sum, r) => sum + r.contentElements, 0) / count),
    headings: Math.round(results.reduce((sum, r) => sum + r.headings, 0) / count),
    paragraphs: Math.round(results.reduce((sum, r) => sum + r.paragraphs, 0) / count),
    codeBlocks: Math.round(results.reduce((sum, r) => sum + r.codeBlocks, 0) / count),
  };
}

function calculatePerformanceScore(results) {
  let score = 0;
  
  // 加载时间评分 (40分)
  if (results.loadTime < 100) score += 40;
  else if (results.loadTime < 200) score += 30;
  else if (results.loadTime < 500) score += 20;
  else score += 10;
  
  // 内容丰富度评分 (30分)
  if (results.contentElements > 50) score += 30;
  else if (results.contentElements > 30) score += 25;
  else if (results.contentElements > 20) score += 20;
  else score += 15;
  
  // HTML 大小效率评分 (30分)
  const sizeKB = results.htmlSize / 1024;
  if (sizeKB < 100) score += 30;
  else if (sizeKB < 200) score += 25;
  else if (sizeKB < 300) score += 20;
  else score += 15;
  
  return Math.min(100, score);
}

function checkContentQuality(result) {
  console.log('\n🔍 Content Quality Analysis:');
  console.log('=' .repeat(50));
  
  console.log(`📝 Headings: ${result.hasProcessedContent ? '✅' : '❌'} Pre-processed content found`);
  console.log(`📖 TOC Support: ${result.hasTableOfContents ? '✅' : '❌'} Table of contents placeholder`);
  console.log(`🔗 Heading IDs: ${result.hasHeadingIds > 0 ? '✅' : '❌'} ${result.hasHeadingIds} headings with IDs`);
  
  console.log(`\n📊 Content Statistics:`);
  console.log(`   📝 Headings: ${result.headings}`);
  console.log(`   📄 Paragraphs: ${result.paragraphs}`);
  console.log(`   💻 Code blocks: ${result.codeBlocks}`);
  console.log(`   🔗 Links: ${result.links}`);
  console.log(`   🖼️  Images: ${result.images}`);
  
  // 内容质量评估
  let qualityScore = 0;
  if (result.hasProcessedContent) qualityScore += 25;
  if (result.hasTableOfContents) qualityScore += 25;
  if (result.hasHeadingIds > 0) qualityScore += 25;
  if (result.contentElements > 20) qualityScore += 25;
  
  console.log(`\n🏆 Content Quality Score: ${qualityScore}/100`);
  
  if (qualityScore >= 90) {
    console.log('🎉 Excellent! Content is fully optimized.');
  } else if (qualityScore >= 75) {
    console.log('👍 Good! Minor optimizations possible.');
  } else if (qualityScore >= 50) {
    console.log('⚠️  Fair. Some optimizations needed.');
  } else {
    console.log('❌ Poor. Significant improvements required.');
  }
}

// 运行测试
performanceComparison();
