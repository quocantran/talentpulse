import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  PlusCircle,
  Search,
  Users,
  Sparkles,
  Edit,
  Trash2,
  Loader2,
  X,
  Check,
} from 'lucide-react';
import {
  employerApi,
  type HrJobItem,
  type CompanyInfo,
} from '../../../lib/employerApi';
import { useToast } from '../../../context/ToastContext';

function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  className = '',
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${
        checked ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

interface JobManagementTabProps {
  company: CompanyInfo | null;
  hasCompany: boolean;
  isProfileComplete: boolean;
  accessToken: string | null;
  todayPostedCount: number;
  maxDailyJobs: number;
  onNavigateTab: (tab: string, extraData?: any) => void;
  onRefreshStats: () => Promise<void>;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
}

export function JobManagementTab({
  company,
  hasCompany,
  isProfileComplete,
  accessToken,
  todayPostedCount,
  maxDailyJobs,
  onNavigateTab,
  onRefreshStats,
  isCreateModalOpen,
  setIsCreateModalOpen,
}: JobManagementTabProps) {
  const { t } = useTranslation();
  const { success, error, info } = useToast();

  const [jobs, setJobs] = useState<HrJobItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');

  // Edit State
  const [editingJob, setEditingJob] = useState<HrJobItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Job Form Data
  const [jobForm, setJobForm] = useState({
    name: '',
    skills: [] as string[],
    skillInput: '',
    salary: 15000000,
    quantity: 1,
    level: 'MIDDLE',
    description: '',
    location: 'Hà Nội',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
  });

  const fetchJobs = async () => {
    if (!accessToken || !hasCompany) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      if (searchQuery.trim()) {
        const res = await employerApi.searchHrJobs(searchQuery, { current: 1, pageSize: 50 }, accessToken);
        setJobs(res.result || []);
      } else {
        const res = await employerApi.getHrJobs({ current: 1, pageSize: 50 }, accessToken);
        setJobs(res.result || []);
      }
    } catch (err) {
      console.error('Failed to load HR jobs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchJobs();
  }, [accessToken, hasCompany, searchQuery]);

  const handleOpenCreate = () => {
    if (!hasCompany || !isProfileComplete) {
      info(t('employer.dashboardTab.onboardingTitle', 'Vui lòng cập nhật đầy đủ thông tin doanh nghiệp trước khi đăng tin'));
      onNavigateTab('company');
      return;
    }

    if (todayPostedCount >= maxDailyJobs) {
      info(`${t('employer.jobsTab.todayQuotaUsed')} ${todayPostedCount}/${maxDailyJobs} ${t('employer.sidebar.freeTierDailyJobs')}`);
      return;
    }

    setEditingJob(null);
    setJobForm({
      name: '',
      skills: ['React', 'TypeScript', 'NodeJS'],
      skillInput: '',
      salary: 15000000,
      quantity: 1,
      level: 'MIDDLE',
      description: '',
      location: company?.address || 'Hà Nội',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (job: HrJobItem) => {
    setEditingJob(job);
    setJobForm({
      name: job.name,
      skills: Array.isArray(job.skills) ? job.skills : [],
      skillInput: '',
      salary: job.salary || 0,
      quantity: job.quantity || 1,
      level: job.level || 'MIDDLE',
      description: job.description || '',
      location: job.location || '',
      startDate: job.startDate ? job.startDate.split('T')[0] : '',
      endDate: job.endDate ? job.endDate.split('T')[0] : '',
      isActive: job.isActive !== false,
    });
    setIsCreateModalOpen(true);
  };

  const handleAddSkill = () => {
    if (!jobForm.skillInput.trim()) return;
    if (!jobForm.skills.includes(jobForm.skillInput.trim())) {
      setJobForm((prev) => ({
        ...prev,
        skills: [...prev.skills, prev.skillInput.trim()],
        skillInput: '',
      }));
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setJobForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const handleSubmitJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !company) return;

    if (!jobForm.name.trim()) {
      info(t('employer.jobsTab.jobNameLabel', 'Vui lòng nhập tiêu đề việc làm'));
      return;
    }

    if (jobForm.skills.length === 0) {
      info(t('employer.jobsTab.skillsLabel', 'Vui lòng thêm ít nhất 1 kỹ năng yêu cầu'));
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingJob) {
        await employerApi.updateJob(
          editingJob._id,
          {
            name: jobForm.name,
            skills: jobForm.skills,
            salary: Number(jobForm.salary),
            quantity: Number(jobForm.quantity),
            level: jobForm.level,
            description: jobForm.description,
            location: jobForm.location,
            startDate: new Date(jobForm.startDate).toISOString(),
            endDate: new Date(jobForm.endDate).toISOString(),
            isActive: jobForm.isActive,
          },
          accessToken,
        );
        success(t('employer.jobsTab.submitEditBtn', 'Cập nhật tin tuyển dụng thành công!'));
      } else {
        await employerApi.createJob(
          {
            name: jobForm.name,
            skills: jobForm.skills,
            company: {
              _id: company._id,
              name: company.name,
              logo: company.logo,
            },
            salary: Number(jobForm.salary),
            quantity: Number(jobForm.quantity),
            level: jobForm.level,
            description: jobForm.description,
            location: jobForm.location,
            startDate: new Date(jobForm.startDate).toISOString(),
            endDate: new Date(jobForm.endDate).toISOString(),
            isActive: jobForm.isActive,
          },
          accessToken,
        );
        success(t('employer.jobsTab.submitCreateBtn', 'Đăng tin tuyển dụng thành công!'));
      }

      setIsCreateModalOpen(false);
      await fetchJobs();
      await onRefreshStats();
    } catch (err: any) {
      console.error('Failed to save job', err);
      error(err?.response?.data?.message || 'Không thể lưu tin tuyển dụng');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm(t('employer.jobsTab.deleteConfirm', 'Bạn có chắc muốn xóa tin tuyển dụng này?'))) return;
    if (!accessToken) return;

    try {
      await employerApi.deleteJob(jobId, accessToken);
      success(t('employer.jobsTab.deleteJobBtn', 'Xóa tin tuyển dụng thành công!'));
      await fetchJobs();
      await onRefreshStats();
    } catch (err: any) {
      console.error('Failed to delete job', err);
      error(err?.response?.data?.message || 'Không thể xóa tin tuyển dụng');
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter === 'ALL') return true;
    const isExpired = new Date(job.endDate) < new Date();
    if (statusFilter === 'ACTIVE') return !isExpired && job.isActive !== false;
    if (statusFilter === 'EXPIRED') return isExpired || job.isActive === false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('employer.jobsTab.title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('employer.jobsTab.subtitle')} &bull; <span className="font-bold text-primary">{company?.name}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <span>{t('employer.jobsTab.todayQuotaUsed')}:</span>
            <span className={todayPostedCount >= maxDailyJobs ? 'text-rose-500 font-extrabold' : 'text-emerald-600 font-extrabold'}>
              {todayPostedCount}/{maxDailyJobs} {t('employer.sidebar.freeTierDailyJobs')}
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition active:scale-95 cursor-pointer"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            <span>{t('employer.jobsTab.postJobBtn')}</span>
          </button>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('employer.jobsTab.searchPlaceholder')}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            {t('employer.jobsTab.filterAll')} ({jobs.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-white text-emerald-600 shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            {t('employer.jobsTab.filterActive')}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('EXPIRED')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              statusFilter === 'EXPIRED'
                ? 'bg-white text-rose-600 shadow-xs dark:bg-slate-900 dark:text-rose-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            {t('employer.jobsTab.filterExpired')}
          </button>
        </div>
      </div>

      {/* 3. Job Listings Table / Cards */}
      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-xs text-slate-400">{t('employer.jobsTab.submittingBtn')}</p>
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">{t('employer.jobsTab.colJobName')}</th>
                  <th className="px-6 py-4">{t('employer.jobsTab.colLevel')}</th>
                  <th className="px-6 py-4">{t('employer.jobsTab.colDates')}</th>
                  <th className="px-6 py-4 text-center">{t('employer.jobsTab.colApplications')}</th>
                  <th className="px-6 py-4 text-center">{t('employer.jobsTab.colStatus')}</th>
                  <th className="px-6 py-4 text-right">{t('employer.jobsTab.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredJobs.map((job) => {
                  const isExpired = new Date(job.endDate) < new Date();
                  const isVisible = job.isActive !== false;
                  return (
                    <tr
                      key={job._id}
                      className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{job.name}</span>
                          {!isVisible && (
                            <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              {t('employer.jobsTab.isActiveOff')}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(job.skills || []).slice(0, 3).map((sk) => (
                            <span
                              key={sk}
                              className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {job.salary ? `${job.salary.toLocaleString('vi-VN')} VND` : 'Thương lượng'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {job.level} &bull; {job.location}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        <div>{new Date(job.endDate).toLocaleDateString('vi-VN')}</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(job.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => onNavigateTab('candidates', { filterJobId: job._id })}
                          className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-primary hover:bg-primary hover:text-white transition cursor-pointer dark:bg-blue-950/60 dark:text-primary-light"
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>{job.applicationsCount || 0} CV</span>
                        </button>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isExpired || !isVisible
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {!isVisible
                            ? t('employer.jobsTab.isActiveOff')
                            : isExpired
                            ? t('employer.jobsTab.statusExpired')
                            : t('employer.jobsTab.statusActive')}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onNavigateTab('candidates', { filterJobId: job._id, openAiRank: true })}
                            className="rounded-lg p-2 text-primary hover:bg-primary/10 transition cursor-pointer"
                            title={t('employer.candidatesTab.modalAiRankTitle')}
                          >
                            <Sparkles className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(job)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
                            title={t('employer.jobsTab.editJobBtn')}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteJob(job._id)}
                            className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition dark:hover:bg-rose-950/40 cursor-pointer"
                            title={t('employer.jobsTab.deleteJobBtn')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <Briefcase className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t('employer.jobsTab.noJobsFound')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {t('employer.jobsTab.subtitle')}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{t('employer.jobsTab.postJobBtn')}</span>
          </button>
        </div>
      )}

      {/* 4. Create / Edit Job Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Briefcase className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {editingJob ? t('employer.jobsTab.modalEditTitle') : t('employer.jobsTab.modalCreateTitle')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {company?.name}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitJob} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Job Name */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('employer.jobsTab.jobNameLabel')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={jobForm.name}
                      onChange={(e) => setJobForm({ ...jobForm, name: e.target.value })}
                      placeholder={t('employer.jobsTab.jobNamePlaceholder')}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Skills Tag Input */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('employer.jobsTab.skillsLabel')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={jobForm.skillInput}
                        onChange={(e) => setJobForm({ ...jobForm, skillInput: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                        placeholder={t('employer.jobsTab.skillPlaceholder')}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                      >
                        {t('employer.jobsTab.addSkillBtn')}
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {jobForm.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="hover:text-rose-500 cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Salary */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('employer.jobsTab.salaryLabel')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={500000}
                      value={jobForm.salary}
                      onChange={(e) => setJobForm({ ...jobForm, salary: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Level */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('employer.jobsTab.levelLabel')} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={jobForm.level}
                      onChange={(e) => setJobForm({ ...jobForm, level: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="INTERN">Intern</option>
                      <option value="FRESHER">Fresher</option>
                      <option value="JUNIOR">Junior</option>
                      <option value="MIDDLE">Middle</option>
                      <option value="SENIOR">Senior</option>
                      <option value="LEAD">Lead</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </div>

                  {/* Location */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('employer.jobsTab.locationLabel')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={jobForm.location}
                      onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                      placeholder="Hà Nội, TP. Hồ Chí Minh..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('employer.jobsTab.quantityLabel')}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={jobForm.quantity}
                      onChange={(e) => setJobForm({ ...jobForm, quantity: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Dates */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('employer.jobsTab.startDateLabel')}
                    </label>
                    <input
                      type="date"
                      required
                      value={jobForm.startDate}
                      onChange={(e) => setJobForm({ ...jobForm, startDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('employer.jobsTab.endDateLabel')}
                    </label>
                    <input
                      type="date"
                      required
                      value={jobForm.endDate}
                      onChange={(e) => setJobForm({ ...jobForm, endDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t('employer.jobsTab.descLabel')} <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={jobForm.description}
                      onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                      placeholder={t('employer.jobsTab.descPlaceholder')}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Job Active Status Toggle (Sliding switch as requested) */}
                  <div className="sm:col-span-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="space-y-0.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {t('employer.jobsTab.isActiveLabel')}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-extrabold ${
                            jobForm.isActive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {jobForm.isActive
                            ? t('employer.jobsTab.isActiveOn')
                            : t('employer.jobsTab.isActiveOff')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('employer.jobsTab.isActiveSubtext')}
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={jobForm.isActive}
                      onChange={(val) => setJobForm({ ...jobForm, isActive: val })}
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    {t('employer.jobsTab.cancelBtn')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span>{editingJob ? t('employer.jobsTab.submitEditBtn') : t('employer.jobsTab.submitCreateBtn')}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

