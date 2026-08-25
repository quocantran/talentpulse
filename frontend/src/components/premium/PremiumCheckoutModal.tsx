import React, { useState } from 'react';
import {
  X,
  Crown,
  CheckCircle2,
  CreditCard,
  Building2,
  ShieldCheck,
  ArrowRight,
  ReceiptText,
} from 'lucide-react';
import { BillingCycle } from './PremiumPricingTable';
import { useToast } from '../../context/ToastContext';

interface PremiumCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planInfo: {
    planType: 'CANDIDATE_PREMIUM' | 'HR_PREMIUM';
    billingCycle: BillingCycle;
    price: number;
    originalPrice: number;
    title: string;
  } | null;
  userEmail?: string;
  userName?: string;
}

type PaymentMethod = 'vnpay' | 'momo' | 'bank_transfer' | 'credit_card';

export const PremiumCheckoutModal: React.FC<PremiumCheckoutModalProps> = ({
  isOpen,
  onClose,
  planInfo,
  userEmail = '',
}) => {
  const { success } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vnpay');
  const [needVatInvoice, setNeedVatInvoice] = useState(false);
  const [companyTaxCode, setCompanyTaxCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);

  if (!isOpen || !planInfo) return null;

  const isHr = planInfo.planType === 'HR_PREMIUM';
  const cycleText =
    planInfo.billingCycle === 'annual'
      ? 'Gói 1 Năm (Tiết kiệm 33%)'
      : planInfo.billingCycle === 'semi_annual'
      ? 'Gói 6 Tháng'
      : 'Gói 1 Tháng';

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaidSuccess(true);
      success('Đăng ký gói Premium thành công! Hệ thống đã kích hoạt toàn bộ đặc quyền.');
    }, 1500);
  };

  const handleCloseAll = () => {
    setIsPaidSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200/90 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleCloseAll}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {!isPaidSuccess ? (
          <div className="space-y-6">
            {/* Modal Header */}
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
                  <Crown className="h-5 w-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-primary-light">
                  Thanh Toán Dịch Vụ VIP
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5">
                Nâng Cấp Gói {planInfo.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Kích hoạt tức thì &bull; Đảm bảo an toàn 100% qua cổng thanh toán bảo mật.
              </p>
            </div>

            {/* Order Summary Box */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 dark:border-primary/30 dark:bg-primary/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-primary/15">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                      {planInfo.title}
                    </h4>
                    <span className="rounded-md bg-amber-400 text-slate-950 px-2 py-0.5 text-[10px] font-black">
                      VIP
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-primary dark:text-primary-light mt-0.5">
                    {cycleText}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-2xl font-black text-primary dark:text-primary-light">
                    {planInfo.price.toLocaleString('vi-VN')} đ
                  </div>
                  {planInfo.originalPrice > planInfo.price && (
                    <div className="text-xs text-slate-400 line-through">
                      {planInfo.originalPrice.toLocaleString('vi-VN')} đ
                    </div>
                  )}
                </div>
              </div>

              {/* User Account Info */}
              <div className="pt-3 text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2">
                <span>
                  Tài khoản đăng ký: <strong className="text-slate-900 dark:text-white">{userEmail || 'Chưa đăng nhập'}</strong>
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="h-4 w-4" />
                  Bảo hành hoàn tiền 7 ngày
                </span>
              </div>
            </div>

            {/* Payment Methods Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Chọn phương thức thanh toán
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Method 1: VNPAY QR */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('vnpay')}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition cursor-pointer ${
                    paymentMethod === 'vnpay'
                      ? 'border-primary bg-primary/5 dark:border-primary-light dark:bg-primary/20 ring-2 ring-primary/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs shrink-0 shadow-xs">
                    VNPAY
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      VNPAY QR
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Quét mã QR mọi ứng dụng ngân hàng
                    </div>
                  </div>
                </button>

                {/* Method 2: MoMo */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('momo')}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition cursor-pointer ${
                    paymentMethod === 'momo'
                      ? 'border-primary bg-primary/5 dark:border-primary-light dark:bg-primary/20 ring-2 ring-primary/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#A50064] text-white font-bold text-xs shrink-0 shadow-xs">
                    MoMo
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Ví MoMo
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Thanh toán qua ví điện tử MoMo
                    </div>
                  </div>
                </button>

                {/* Method 3: Chuyển khoản 24/7 */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition cursor-pointer ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-primary bg-primary/5 dark:border-primary-light dark:bg-primary/20 ring-2 ring-primary/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-xs shrink-0 shadow-xs">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Chuyển khoản 24/7
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Vietcombank / MB Bank / Techcombank
                    </div>
                  </div>
                </button>

                {/* Method 4: Thẻ Quốc Tế */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition cursor-pointer ${
                    paymentMethod === 'credit_card'
                      ? 'border-primary bg-primary/5 dark:border-primary-light dark:bg-primary/20 ring-2 ring-primary/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-white font-bold text-xs shrink-0 shadow-xs">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Thẻ Visa / Mastercard
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Thẻ tín dụng / ghi nợ quốc tế
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* VAT Invoice option (especially for HR) */}
            {isHr && (
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needVatInvoice}
                    onChange={(e) => setNeedVatInvoice(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary dark:border-slate-700"
                  />
                  <span className="flex items-center gap-1.5">
                    <ReceiptText className="h-4 w-4 text-primary" />
                    Yêu cầu xuất hóa đơn tài chính (VAT điện tử) cho doanh nghiệp
                  </span>
                </label>

                {needVatInvoice && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Tên công ty / Tổ chức
                      </label>
                      <input
                        type="text"
                        placeholder="Công ty Cổ phần Công nghệ ABC"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Mã số thuế (MST)
                      </label>
                      <input
                        type="text"
                        placeholder="0101234567"
                        value={companyTaxCode}
                        onChange={(e) => setCompanyTaxCode(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Địa chỉ đăng ký kinh doanh
                      </label>
                      <input
                        type="text"
                        placeholder="Tầng 5, Tòa nhà Landmark, Cầu Giấy, Hà Nội"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCloseAll}
                className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmPayment}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary px-7 py-3 text-sm font-extrabold text-white shadow-lg shadow-primary/30 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Đang xử lý giao dịch...
                  </span>
                ) : (
                  <>
                    <span>Thanh toán {planInfo.price.toLocaleString('vi-VN')} đ</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Payment Success State */
          <div className="py-8 text-center space-y-5 animate-fade-in-up">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shadow-inner">
              <CheckCircle2 className="h-12 w-12" />
            </div>

            <div className="space-y-1">
              <span className="rounded-full bg-amber-400 text-slate-950 px-3 py-1 text-xs font-black">
                KÍCH HOẠT THÀNH CÔNG VIP
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
                Chúc mừng bạn đã nâng cấp {planInfo.title}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Tài khoản <strong className="text-primary">{userEmail}</strong> đã được cấp quyền truy cập trọn bộ đặc quyền cao cấp nhất.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/60 max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã giao dịch:</span>
                <strong className="font-mono text-slate-900 dark:text-white">TP-VIP-{Math.floor(100000 + Math.random() * 900000)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gói dịch vụ:</span>
                <strong className="text-primary">{planInfo.title} ({cycleText})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tiền:</span>
                <strong className="text-slate-900 dark:text-white">{planInfo.price.toLocaleString('vi-VN')} đ</strong>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleCloseAll}
                className="rounded-2xl bg-primary px-8 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-primary/30 hover:bg-primary-dark transition active:scale-95 cursor-pointer"
              >
                Bắt đầu trải nghiệm ngay
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
