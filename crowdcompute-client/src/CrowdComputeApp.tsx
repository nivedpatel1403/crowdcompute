import React, { useState, useEffect } from 'react';
import { Upload, Activity, CheckCircle, Clock, AlertCircle, Loader, Download } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

interface JobParam {
  key: string;
  label: string;
  type: string;
  default?: string | number;
  required?: boolean;
}

interface JobType {
  name: string;
  description: string;
  params: JobParam[];
}

interface Job {
  job_type: string;
  status?: string;
  total_tasks?: number;
  completed_tasks?: number;
  map_results?: string[];
  results?: string[];
  cracked_password?: string | null;
}

interface Jobs {
  [jobId: string]: Job;
}

type JobStatus = 'success' | 'running' | 'mapping' | 'reducing';

const CrowdComputeApp: React.FC = () => {
  const [jobs, setJobs] = useState<Jobs>({});
  const [selectedJobType, setSelectedJobType] = useState<string>('sort_map');
  const [file, setFile] = useState<File | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const jobTypes: Record<string, JobType> = {
    sort_map: {
      name: 'Distributed Sort',
      description: 'Sort large text files using MapReduce',
      params: [
        { key: 'num_chunks', label: 'Number of Chunks', type: 'number', default: 10 }
      ]
    },
    hashcat_crack: {
      name: 'Password Cracking',
      description: 'Crack password hashes using distributed Hashcat',
      params: [
        { key: 'target_hash', label: 'Target Hash', type: 'text', required: true },
        { key: 'hash_mode', label: 'Hash Mode', type: 'text', default: '0' },
        { key: 'num_chunks', label: 'Number of Chunks', type: 'number', default: 5 }
      ]
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchJobs, 2000);
    fetchJobs();
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/tasks`);
      const data = await response.json();
      setJobs(data.job_status || {});
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleParamChange = (key: string, value: string): void => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    const currentJobType = jobTypes[selectedJobType];
    for (const param of currentJobType.params) {
      if (param.required && !params[param.key]) {
        setError(`${param.label} is required`);
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      Object.entries(params).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch(`${API_BASE}/submit-job/${selectedJobType}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit job');
      }

      await response.json();
      setFile(null);
      setParams({});
      fetchJobs();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const getJobStatus = (job: Job): JobStatus => {
    if (job.job_type === 'hashcat') {
      if (job.status === 'cracked') return 'success';
      if (job.completed_tasks === job.total_tasks) return 'success';
      return 'running';
    }
    
    if (job.job_type === 'sort') {
      if (job.completed_tasks && job.total_tasks && job.completed_tasks < job.total_tasks) return 'mapping';
      return 'reducing';
    }
    
    return 'running';
  };

  const getStatusIcon = (status: JobStatus): JSX.Element => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'running':
      case 'mapping':
      case 'reducing':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: JobStatus): string => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'running':
      case 'mapping':
      case 'reducing':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Activity className="w-12 h-12 text-purple-400 mr-3" />
            <h1 className="text-5xl font-bold text-white">CrowdCompute</h1>
          </div>
          <p className="text-purple-300 text-lg">Distributed Computing Coordinator</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Job Submission Panel */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Upload className="w-6 h-6 mr-2 text-purple-600" />
              Submit New Job
            </h2>

            <div className="space-y-6">
              {/* Job Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Type
                </label>
                <select
                  value={selectedJobType}
                  onChange={(e) => {
                    setSelectedJobType(e.target.value);
                    setParams({});
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
                >
                  {Object.entries(jobTypes).map(([key, job]) => (
                    <option key={key} value={key}>{job.name}</option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-2">
                  {jobTypes[selectedJobType].description}
                </p>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload File
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                </div>
                {file && (
                  <p className="text-sm text-green-600 mt-2">✓ {file.name}</p>
                )}
              </div>

              {/* Dynamic Parameters */}
              {jobTypes[selectedJobType].params.map((param) => (
                <div key={param.key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {param.label}
                    {param.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type={param.type}
                    value={params[param.key] || param.default?.toString() || ''}
                    onChange={(e) => handleParamChange(param.key, e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition"
                    placeholder={param.default?.toString() || ''}
                  />
                </div>
              ))}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Submit Job
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Active Jobs Panel */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Activity className="w-6 h-6 mr-2 text-purple-600" />
              Active Jobs
            </h2>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {Object.keys(jobs).length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No active jobs</p>
                  <p className="text-sm text-gray-400 mt-2">Submit a job to get started</p>
                </div>
              ) : (
                Object.entries(jobs).map(([jobId, job]) => {
                  const status = getJobStatus(job);
                  return (
                    <div
                      key={jobId}
                      className={`border-2 rounded-xl p-5 transition ${getStatusColor(status)}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(status)}
                          <div>
                            <h3 className="font-bold text-gray-800">{jobId}</h3>
                            <p className="text-sm text-gray-600 capitalize">
                              {job.job_type} • {status}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {job.total_tasks && (
                        <div className="mb-3">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{job.completed_tasks}/{job.total_tasks} tasks</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${((job.completed_tasks || 0) / job.total_tasks) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Results */}
                      {job.job_type === 'hashcat' && job.status === 'cracked' && (
                        <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg">
                          <p className="text-sm font-semibold text-green-800 mb-2">
                            ✓ Password Cracked!
                          </p>
                          {job.map_results?.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Download className="w-4 h-4" />
                              Download Result
                            </a>
                          ))}
                        </div>
                      )}

                      {job.job_type === 'sort' && job.completed_tasks === job.total_tasks && (
                        <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                          <p className="text-sm font-semibold text-blue-800 mb-2">
                            ✓ Sort Complete!
                          </p>
                          {job.results?.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Download className="w-4 h-4" />
                              Download Sorted File
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrowdComputeApp;