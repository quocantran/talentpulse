import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Users,
  Upload,
  Search,
  UserCheck,
  UserX,
  LogOut,
  Save,
  ShieldCheck,
  Clock,
  Loader2,
  Trash2,
} from 'lucide-react';

import {
  employerApi,
  type CompanyInfo,
  type HrMember,
  type PendingHrRequest,
} from '../../../lib/employerApi';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../auth/AuthContext';

interface CompanyProfileTabProps {
  company: CompanyInfo | null;
  hasCompany: boolean;
  accessToken: string | null;
  onRefreshData: () => Promise<void>;
}

export function CompanyProfileTab({
  company,
  hasCompany,
  accessToken,
  onRefreshData,
}: CompanyProfileTabProps) {
  const { t } = useTranslation();
  const { success, error, info } = useToast();
  const { user } = useAuth();

  const [subTab, setSubTab] = useState<'profile' | 'team' | 'join'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: company?.name || '',
    taxCode: company?.taxCode || '',
    scale: company?.scale || '50-200',
    address: company?.address || '',
    description: company?.description || '',
    logo: company?.logo || '',
  });

  // HR Team State
  const [teamMembers, setTeamMembers] = useState<HrMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingHrRequest[]>([]);
  const [isCreator, setIsCreator] = useState(false);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);

  // Company Search & Join State
  const [searchQuery, setSearchQuery] = useState('');
  const [companyList, setCompanyList] = useState<CompanyInfo[]>([]);
  const [isSearchingCompanies, setIsSearchingCompanies] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        taxCode: company.taxCode || '',
        scale: company.scale || '50-200',
        address: company.address || '',
        description: company.description || '',
        logo: company.logo || '',
      });
      if (accessToken && company._id) {
        void fetchTeamData(company._id);
      }
    }
  }, [company, accessToken]);

  const fetchTeamData = async (companyId: string) => {
    if (!accessToken) return;
    setIsLoadingTeam(true);
    try {
      const [members, creatorStatus, pending] = await Promise.all([
        employerApi.getCompanyHrs(companyId, accessToken).catch(() => []),
        employerApi.isCompanyCreator(companyId, accessToken).catch(() => false),
        employerApi.getPendingHrs(companyId, accessToken).catch(() => []),
      ]);
      setTeamMembers(members);
      setIsCreator(creatorStatus);
      setPendingRequests(pending);
    } catch (err) {
      console.error('Failed to load HR team data', err);
    } finally {
      setIsLoadingTeam(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    if (file.size > 5 * 1024 * 1024) {
      error('Kích thước ảnh vượt quá 5MB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const res = await employerApi.uploadImage(file, accessToken);
      const logoUrl = res.url || res.fileName;
      setFormData((prev) => ({ ...prev, logo: logoUrl }));
      success(t('employer.companyTab.uploadLogoBtn'));
    } catch (err: any) {
      console.error('Failed to upload logo', err);
      error(err?.message || 'Tải logo thất bại');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!formData.name.trim()) {
      info(t('employer.companyTab.nameLabel'));
      return;
    }

    setIsSaving(true);
    try {
      if (hasCompany && company?._id) {
        await employerApi.updateCompany(
          company._id,
          {
            name: formData.name,
            taxCode: formData.taxCode,
            scale: formData.scale,
            address: formData.address,
            description: formData.description,
            logo: formData.logo,
          },
          accessToken,
        );
        success(t('employer.companyTab.saveCompanyBtn'));
      } else {
        await employerApi.createCompanyByHr(
          {
            name: formData.name,
            taxCode: formData.taxCode,
            scale: formData.scale,
            address: formData.address,
            description: formData.description,
            logo: formData.logo,
          },
          accessToken,
        );
        success(t('employer.companyTab.saveCompanyBtn'));
      }
      await onRefreshData();
    } catch (err: any) {
      console.error('Failed to save company', err);
      error(err?.response?.data?.message || err?.message || 'Không thể lưu thông tin công ty');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearchCompanies = async () => {
    if (!searchQuery.trim() || !accessToken) return;
    setIsSearchingCompanies(true);
    try {
      const res = await employerApi.getAllCompanies(`name=${encodeURIComponent(searchQuery)}`, accessToken);
      setCompanyList(res.result || []);
    } catch (err: any) {
      error(err.message || 'Tìm kiếm công ty thất bại');
    } finally {
      setIsSearchingCompanies(false);
    }
  };

  const handleRequestJoin = async (targetCompanyId: string) => {
    if (!accessToken) return;
    setIsJoining(true);
    try {
      const res = await employerApi.requestJoinCompany(targetCompanyId, accessToken);
      success(res.message || 'Đã gửi yêu cầu tham gia công ty!');
      await onRefreshData();
    } catch (err: any) {
      error(err.message || 'Gửi yêu cầu tham gia thất bại');
    } finally {
      setIsJoining(false);
    }
  };

  const handleApproveHr = async (userId: string) => {
    if (!accessToken || !company?._id) return;
    try {
      const res = await employerApi.approveHr(company._id, userId, accessToken);
      success(res.message || 'Đã duyệt nhân sự!');
      void fetchTeamData(company._id);
      await onRefreshData();
    } catch (err: any) {
      error(err.message || 'Duyệt nhân sự thất bại');
    }
  };

  const handleRejectHr = async (userId: string) => {
    if (!accessToken || !company?._id) return;
    try {
      const res = await employerApi.rejectHr(company._id, userId, accessToken);
      info(res.message || 'Đã từ chối yêu cầu');
      void fetchTeamData(company._id);
    } catch (err: any) {
      error(err.message || 'Từ chối thất bại');
    }
  };

  const handleRemoveHr = async (hrId: string) => {
    if (!accessToken || !company?._id) return;
    if (!window.confirm('Bạn có chắc muốn xóa HR này khỏi công ty?')) return;

    try {
      const res = await employerApi.removeHrFromCompany(company._id, hrId, accessToken);
      success(res.message || 'Đã xóa HR khỏi công ty');
      void fetchTeamData(company._id);
    } catch (err: any) {
      error(err.message || 'Xóa HR thất bại');
    }
  };

  const handleLeaveCompany = async () => {
    if (!accessToken) return;
    if (!window.confirm('Bạn có chắc muốn rời khỏi công ty hiện tại?')) return;

    try {
      const res = await employerApi.leaveCompany(accessToken);
      info(res.message || 'Đã rời công ty');
      await onRefreshData();
    } catch (err: any) {
      error(err.message || 'Rời công ty thất bại');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('employer.companyTab.title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('employer.companyTab.subtitle')}
          </p>
        </div>

        {/* Sub-tabs pills */}
        <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setSubTab('profile')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
              subTab === 'profile'
                ? 'bg-white text-primary shadow-sm dark:bg-slate-900 dark:text-primary-light'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>{t('employer.companyTab.tabProfile')}</span>
          </button>

          {hasCompany && (
            <button
              type="button"
              onClick={() => setSubTab('team')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                subTab === 'team'
                  ? 'bg-white text-primary shadow-sm dark:bg-slate-900 dark:text-primary-light'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>{t('employer.companyTab.tabTeam')} ({teamMembers.length})</span>
              {pendingRequests.length > 0 && isCreator && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          )}

          {!hasCompany && (
            <button
              type="button"
              onClick={() => setSubTab('join')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                subTab === 'join'
                  ? 'bg-white text-primary shadow-sm dark:bg-slate-900 dark:text-primary-light'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Search className="h-4 w-4" />
              <span>{t('employer.companyTab.tabJoin')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Content Sections */}
      {subTab === 'profile' && (
        <form onSubmit={handleSaveCompany} className="space-y-6">
          {/* Main Card */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {t('employer.companyTab.profileHeader')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('employer.companyTab.profileDesc')}
                  </p>
                </div>
              </div>

              {hasCompany && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t('employer.sidebar.verifiedBadge')}
                  </span>
                </div>
              )}
            </div>

            {/* Logo Upload & Brand Identity */}
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 rounded-2xl bg-slate-50/80 p-5 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900 overflow-hidden">
                {formData.logo ? (
                  <img src={formData.logo} alt="Company Logo" className="h-full w-full object-contain p-2" />
                ) : (
                  <Building2 className="h-10 w-10 text-slate-400" />
                )}
                {isUploadingLogo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('employer.companyTab.logoLabel')} <span className="text-rose-500">*</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                  {t('employer.companyTab.profileDesc')}
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-dark transition cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>{isUploadingLogo ? t('employer.companyTab.uploadingLogo') : t('employer.companyTab.uploadLogoBtn')}</span>
                  </button>
                  {formData.logo && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, logo: '' }))}
                      className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
                    >
                      {t('employer.jobsTab.deleteJobBtn')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Company Name */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('employer.companyTab.nameLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ví dụ: TalentPulse Technology Group"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Tax Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('employer.companyTab.taxCodeLabel')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.taxCode}
                  onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                  placeholder="Ví dụ: 0108923456"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Scale / Size */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('employer.companyTab.scaleLabel')} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.scale}
                  onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="1-50">1 - 50</option>
                  <option value="50-200">50 - 200</option>
                  <option value="200-500">200 - 500</option>
                  <option value="500-1000">500 - 1000</option>
                  <option value="1000+">1000+</option>
                </select>
              </div>

              {/* Address */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('employer.companyTab.addressLabel')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ví dụ: Tầng 12, Tòa nhà Landmark, Cầu Giấy, Hà Nội"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('employer.companyTab.descLabel')} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết về văn hóa doanh nghiệp, lĩnh vực hoạt động..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Save CTA */}
            <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('employer.companyTab.savingCompany')}</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{t('employer.companyTab.saveCompanyBtn')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* HR Team Management Section */}
      {subTab === 'team' && hasCompany && (
        <div className="space-y-6">
          {/* Pending Requests for Creator */}
          {isCreator && pendingRequests.length > 0 && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-base mb-4">
                <Clock className="h-5 w-5" />
                <span>{t('employer.companyTab.pendingHeader')} ({pendingRequests.length})</span>
              </div>
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req.userId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-xs dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                        {(req.name?.[0] || 'U').toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {req.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {req.email} &bull; {new Date(req.requestedAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApproveHr(req.userId)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>{t('employer.companyTab.approveBtn')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectHr(req.userId)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        <span>{t('employer.companyTab.rejectBtn')}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active HR Members List */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {t('employer.companyTab.teamHeader')} ({teamMembers.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('employer.companyTab.teamDesc')}
                </p>
              </div>

              {!isCreator && (
                <button
                  type="button"
                  onClick={handleLeaveCompany}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{t('employer.companyTab.leaveCompanyBtn')}</span>
                </button>
              )}
            </div>

            {isLoadingTeam ? (
              <div className="py-12 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {teamMembers.map((member) => {
                  const isCurrentUser = member._id === user?._id;
                  return (
                    <div
                      key={member._id}
                      className="flex items-center justify-between py-3.5 gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            (member.name?.[0] || 'U').toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {member.name}
                            </h4>
                            {isCurrentUser && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.2 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {member.email} &bull; {t('employer.companyTab.joinedAt')}: {new Date(member.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>

                      {isCreator && !isCurrentUser && (
                        <button
                          type="button"
                          onClick={() => handleRemoveHr(member._id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition dark:hover:bg-rose-950/40 cursor-pointer"
                          title={t('employer.companyTab.removeHrBtn')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Join Existing Company Section */}
      {subTab === 'join' && !hasCompany && (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('employer.companyTab.joinHeader')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('employer.companyTab.joinDesc')}
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchCompanies()}
                placeholder={t('employer.companyTab.searchCompanyPlaceholder')}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={handleSearchCompanies}
              disabled={isSearchingCompanies}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-dark transition cursor-pointer"
            >
              {isSearchingCompanies ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span>{t('employer.companyTab.searchBtn')}</span>
            </button>
          </div>

          {companyList.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {companyList.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center shrink-0 p-1 dark:border-slate-700">
                      {c.logo ? (
                        <img src={c.logo} alt={c.name} className="h-full w-full object-contain" />
                      ) : (
                        <Building2 className="h-6 w-6 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {c.name}
                      </h4>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {c.address || 'Chưa cập nhật địa chỉ'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRequestJoin(c._id)}
                    disabled={isJoining}
                    className="shrink-0 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
                  >
                    {t('employer.companyTab.requestJoinBtn')}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400">
              <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nhập tên doanh nghiệp và bấm Tìm kiếm</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
