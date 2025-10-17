'use client';

import { useState, useEffect } from 'react';

interface User {
  email: string;
  name: string;
  picture: string;
}

interface DailyMetrics {
  date: string;
  clicks: number;
  impressions: number;
  avgPosition: number;
  ctr: number;
}

interface SearchResult {
  keyword: string;
  data: any;
  dailyData: DailyMetrics[];
  clicks: number;
  impressions: number;
  avgPosition: number;
  ctr: number;
}

export function GoogleSearchConsole({ user }: { user: User }) {
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  const [sites, setSites] = useState<string[]>([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [keywords, setKeywords] = useState('');
  const [dateRange, setDateRange] = useState('7');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchType, setSearchType] = useState('web');
  const [country, setCountry] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [error, setError] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const response = await fetch('/api/search-console/sites');
      const data = await response.json();
      if (data.sites) {
        setSites(data.sites);
        if (data.sites.length > 0) {
          setSelectedSite(data.sites[0]);
        }
      }
    } catch (error) {
      console.error('Error loading sites:', error);
      setError('Không thể tải danh sách website');
    }
  };

  const handleSearch = async () => {
    if (!selectedSite || !keywords.trim()) {
      setError('Vui lòng chọn website và nhập từ khóa');
      return;
    }

    const keywordList = keywords.split('\n').filter(k => k.trim());
    if (keywordList.length === 0) {
      setError('Vui lòng nhập ít nhất một từ khóa');
      return;
    }

    if (keywordList.length > 1000) {
      setError('Tối đa 1000 từ khóa mỗi lần tìm kiếm');
      return;
    }

    setIsSearching(true);
    setProgress(0);
    setError('');
    setResults([]);
    setCurrentKeyword('');

    try {
      const response = await fetch('/api/search-console/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site: selectedSite,
          keywords: keywordList,
          dateRange,
          customStartDate: dateRange === 'custom' ? customStartDate : undefined,
          customEndDate: dateRange === 'custom' ? customEndDate : undefined,
          searchType,
          country,
        }),
      });

      if (!response.ok) {
        throw new Error('Lỗi khi tìm kiếm');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const tempResults: SearchResult[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const message = JSON.parse(line);

              if (message.type === 'result') {
                // Add result to list
                tempResults.push(message.data);
                setResults([...tempResults]);

                // Update progress
                if (message.progress) {
                  setProgress(message.progress.percentage);
                  setCurrentKeyword(message.data.keyword);
                }
              } else if (message.type === 'complete') {
                // Processing complete
                console.log('Processing complete:', message.summary);
                setProgress(100);
              }
            } catch (e) {
              // Skip invalid JSON lines
              console.warn('Failed to parse message:', line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error searching:', error);
      setError('Không thể tìm kiếm dữ liệu');
    } finally {
      setIsSearching(false);
      setCurrentKeyword('');
    }
  };

  const handleStop = () => {
    setIsSearching(false);
    setProgress(0);
    setCurrentKeyword('');
  };

  const copyToClipboard = () => {
    const tableData = generateTableData();
    navigator.clipboard.writeText(tableData);
    alert('Đã copy kết quả vào clipboard!');
  };

  const getAllDates = () => {
    if (results.length === 0 || !results[0].dailyData) return [];
    return results[0].dailyData.map(d => d.date);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const generateTableData = () => {
    if (results.length === 0) return '';

    const dates = getAllDates();
    const headers = ['Từ khóa', 'Tổng Clicks', 'Tổng Impressions', 'Vị trí TB', 'CTR (%)', ...dates.map(d => formatDate(d))];

    const rows = results.map(result => {
      const basicInfo = [
        result.keyword,
        result.clicks.toString(),
        result.impressions.toString(),
        result.avgPosition > 0 ? result.avgPosition.toFixed(1) : '-',
        result.ctr > 0 ? result.ctr.toFixed(2) : '-'
      ];

      const dailyPositions = result.dailyData?.map(d =>
        d.avgPosition > 0 ? d.avgPosition.toFixed(1) : '-'
      ) || [];

      return [...basicInfo, ...dailyPositions];
    });

    return [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
  };

  const exportToCSV = () => {
    const csvContent = generateTableData();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `search-console-results-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedResults = () => {
    if (!sortColumn) return results;

    const sorted = [...results].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      // Handle different column types
      switch (sortColumn) {
        case 'keyword':
          aValue = a.keyword.toLowerCase();
          bValue = b.keyword.toLowerCase();
          break;
        case 'clicks':
          aValue = a.clicks;
          bValue = b.clicks;
          break;
        case 'impressions':
          aValue = a.impressions;
          bValue = b.impressions;
          break;
        case 'avgPosition':
          aValue = a.avgPosition || 999; // Put items without position at the end
          bValue = b.avgPosition || 999;
          break;
        case 'ctr':
          aValue = a.ctr;
          bValue = b.ctr;
          break;
        default:
          // Handle date columns
          if (sortColumn.startsWith('date-')) {
            const dateStr = sortColumn.replace('date-', '');
            const aDaily = a.dailyData?.find(d => d.date === dateStr);
            const bDaily = b.dailyData?.find(d => d.date === dateStr);
            aValue = aDaily?.avgPosition || 999;
            bValue = bDaily?.avgPosition || 999;
          } else {
            return 0;
          }
      }

      // Compare values
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <span className="ml-1 text-gray-400">⇅</span>;
    }
    return sortDirection === 'asc' ?
      <span className="ml-1 text-blue-600">↑</span> :
      <span className="ml-1 text-blue-600">↓</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl">🔍</span>
              <h1 className="ml-3 text-xl font-semibold text-gray-900">
                Google Search Console - Kiểm tra thứ hạng từ khóa
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-gray-700">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 font-medium text-sm"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📝 Thông tin tìm kiếm</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Website Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                style={{ color: '#000000' }}
                disabled={isLoading}
              >
                {sites.length === 0 ? (
                  <option style={{ color: '#000000' }}>Đang tải danh sách website...</option>
                ) : (
                  sites.map((site) => (
                    <option key={site} value={site} style={{ color: '#000000' }}>
                      {site}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khoảng thời gian
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                style={{ color: '#000000' }}
              >
                <option value="7" style={{ color: '#000000' }}>7 ngày qua</option>
                <option value="30" style={{ color: '#000000' }}>30 ngày qua</option>
                <option value="this_month" style={{ color: '#000000' }}>Tháng này</option>
                <option value="last_month" style={{ color: '#000000' }}>Tháng trước</option>
                <option value="custom" style={{ color: '#000000' }}>Tùy chỉnh</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {dateRange === 'custom' && (
              <>
                <div>
                  <label htmlFor="custom-start-date" className="block text-sm font-medium text-gray-700 mb-2">
                    Từ ngày
                  </label>
                  <input
                    id="custom-start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="custom-end-date" className="block text-sm font-medium text-gray-700 mb-2">
                    Đến ngày
                  </label>
                  <input
                    id="custom-end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {/* Search Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại tìm kiếm
              </label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                style={{ color: '#000000' }}
              >
                <option value="web" style={{ color: '#000000' }}>Web</option>
                <option value="image" style={{ color: '#000000' }}>Hình ảnh</option>
                <option value="video" style={{ color: '#000000' }}>Video</option>
                <option value="news" style={{ color: '#000000' }}>Tin tức</option>
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quốc gia
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                style={{ color: '#000000' }}
              >
                <option value="" style={{ color: '#000000' }}>Tất cả</option>
                <option value="vnm" style={{ color: '#000000' }}>Việt Nam</option>
                <option value="usa" style={{ color: '#000000' }}>Hoa Kỳ</option>
                <option value="gbr" style={{ color: '#000000' }}>Anh</option>
                <option value="aus" style={{ color: '#000000' }}>Úc</option>
                <option value="can" style={{ color: '#000000' }}>Canada</option>
              </select>
            </div>
          </div>

          {/* Keywords */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Từ khóa (mỗi từ khóa 1 dòng)
            </label>
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Nhập từ khóa cần kiểm tra...&#10;mỗi từ khóa 1 dòng"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 text-black"
              style={{ color: '#000000' }}
              disabled={isSearching}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Search Buttons */}
          <div className="flex space-x-4">
            {!isSearching ? (
              <button
                onClick={handleSearch}
                disabled={!selectedSite || !keywords.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                🔍 Tìm kiếm thứ hạng
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="bg-red-600 text-white px-6 py-2 rounded-md font-medium hover:bg-red-700"
              >
                ⏹ Dừng lại
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {isSearching && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Đang xử lý: {currentKeyword}</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">📊 Kết quả</h2>
              <div className="flex space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                >
                  📋 Copy kết quả
                </button>
                <button
                  onClick={exportToCSV}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  📥 Xuất CSV
                </button>
              </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => handleSort('keyword')}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center">
                        Từ khóa
                        {renderSortIcon('keyword')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('clicks')}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center">
                        Tổng Clicks
                        {renderSortIcon('clicks')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('impressions')}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center">
                        Tổng Impressions
                        {renderSortIcon('impressions')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('avgPosition')}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center">
                        Vị trí TB
                        {renderSortIcon('avgPosition')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('ctr')}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    >
                      <div className="flex items-center">
                        CTR (%)
                        {renderSortIcon('ctr')}
                      </div>
                    </th>
                    {getAllDates().map((date) => (
                      <th
                        key={date}
                        onClick={() => handleSort(`date-${date}`)}
                        className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 select-none"
                      >
                        <div className="flex items-center justify-center">
                          {formatDate(date)}
                          {renderSortIcon(`date-${date}`)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getSortedResults().map((result, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                        {result.keyword}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.clicks}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.impressions}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.avgPosition > 0 ? result.avgPosition.toFixed(1) : '-'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.ctr > 0 ? result.ctr.toFixed(2) : '-'}
                      </td>
                      {result.dailyData?.map((daily) => (
                        <td key={daily.date} className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                          {daily.avgPosition > 0 ? daily.avgPosition.toFixed(1) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Tóm tắt</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Tổng từ khóa:</span>
                  <span className="ml-2 font-medium">{results.length}</span>
                </div>
                <div>
                  <span className="text-gray-500">Tổng clicks:</span>
                  <span className="ml-2 font-medium">
                    {results.reduce((sum, r) => sum + r.clicks, 0)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Tổng impressions:</span>
                  <span className="ml-2 font-medium">
                    {results.reduce((sum, r) => sum + r.impressions, 0)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Vị trí TB:</span>
                  <span className="ml-2 font-medium">
                    {results.length > 0 
                      ? (results.reduce((sum, r) => sum + r.avgPosition, 0) / results.length).toFixed(1)
                      : '-'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
