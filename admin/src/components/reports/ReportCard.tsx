import { useState } from 'react';
import {
  MapPin, Calendar, Eye, CheckCircle, XCircle, Clock, Image as ImageIcon,
} from 'lucide-react';
import type { Report } from '../../types';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import { formatDate, categoryLabel } from '../../utils/formatters';

interface ReportCardProps {
  report: Report;
  onVerify: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onMarkUnderVerification: (id: string) => void;
  isVerifying?: boolean;
  isRejecting?: boolean;
  isMarking?: boolean;
}

const categoryIcons: Record<string, string> = {
  harassment: '⚠️',
  poor_lighting: '💡',
  unsafe_road: '🚧',
  suspicious_activity: '👁️',
  infrastructure: '🏗️',
  other: '📋',
};

export default function ReportCard({
  report,
  onVerify,
  onReject,
  onMarkUnderVerification,
  isVerifying,
  isRejecting,
  isMarking,
}: ReportCardProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    onReject(report.id, rejectReason.trim());
    setShowRejectModal(false);
    setRejectReason('');
  };

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{categoryIcons[report.category] ?? '📋'}</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {categoryLabel(report.category as any)}
              </p>
              <p className="text-xs text-gray-400">ID: {report.id.slice(-8)}</p>
            </div>
          </div>
          <Badge status={report.status} size="sm" />
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{report.description}</p>

        {/* Meta */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {report.location.area ?? report.location.address ?? `${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}`}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {formatDate(report.createdAt)}
          </span>
          <span className="flex items-center gap-1 font-mono">
            👤 {report.reporterAnonId}
          </span>
          {report.imageUrl && (
            <button
              onClick={() => setShowImageModal(true)}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <ImageIcon size={12} /> View Image
            </button>
          )}
        </div>

        {/* Rejection reason display */}
        {report.rejectionReason && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3 text-xs text-red-700">
            <strong>Rejection reason:</strong> {report.rejectionReason}
          </div>
        )}

        {/* Actions */}
        {(report.status === 'pending' || report.status === 'under_verification') && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
            {report.status === 'pending' && (
              <button
                onClick={() => onMarkUnderVerification(report.id)}
                disabled={isMarking}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
              >
                <Clock size={12} /> Under Verification
              </button>
            )}
            <button
              onClick={() => onVerify(report.id)}
              disabled={isVerifying}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
            >
              <CheckCircle size={12} /> Verify
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isRejecting}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              <XCircle size={12} /> Reject
            </button>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Report" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          Provide a reason for rejecting this report. This helps maintain transparency.
        </p>
        <textarea
          className="input-field resize-none h-28 mb-4"
          placeholder="Enter rejection reason..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
        <div className="flex gap-2 justify-end">
          <button className="btn-secondary text-sm" onClick={() => setShowRejectModal(false)}>
            Cancel
          </button>
          <button
            className="btn-danger text-sm"
            onClick={handleReject}
            disabled={!rejectReason.trim() || isRejecting}
          >
            Reject Report
          </button>
        </div>
      </Modal>

      {/* Image Modal */}
      {report.imageUrl && (
        <Modal isOpen={showImageModal} onClose={() => setShowImageModal(false)} title="Report Image" size="lg">
          <div className="flex justify-center">
            <img
              src={report.imageUrl}
              alt="Report evidence"
              className="max-w-full rounded-xl object-contain max-h-[60vh]"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Image+Not+Available'; }}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
