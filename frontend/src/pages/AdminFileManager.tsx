import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, FileText, Image, File, Download, Search, FolderOpen } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import api from '../api';
import { toast } from 'sonner';

interface FileItem {
    id: string;
    name: string;
    size: number;
    content_type: string;
    created_at: string;
    category: string;
    path: string;
}

const CATEGORIES = [
    { value: 'general', label: 'Genel', icon: '📁' },
    { value: 'contracts', label: 'Sözleşmeler', icon: '📄' },
    { value: 'invoices', label: 'Faturalar', icon: '🧾' },
    { value: 'reports', label: 'Raporlar', icon: '📊' },
];

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(contentType: string) {
    if (contentType.startsWith('image/')) return <Image size={20} />;
    if (contentType === 'application/pdf') return <FileText size={20} />;
    return <File size={20} />;
}

export default function AdminFileManager() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [category, setCategory] = useState('general');
    const [searchQuery, setSearchQuery] = useState('');
    const [dragOver, setDragOver] = useState(false);

    useSEO({ title: 'Dosya Yönetimi - Admin', noIndex: true });

    const fetchFiles = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/api/admin/files?category=${category}`);
            setFiles(data.files || []);
        } catch {
            toast.error('Dosyalar yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    }, [category]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleUpload = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;

        setUploading(true);
        let successCount = 0;

        for (const file of Array.from(fileList)) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('category', category);

                await api.post('/api/admin/files/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                successCount++;
            } catch {
                toast.error(`${file.name} yüklenemedi`);
            }
        }

        if (successCount > 0) {
            toast.success(`${successCount} dosya başarıyla yüklendi`);
            fetchFiles();
        }
        setUploading(false);
    };

    const handleDelete = async (filePath: string, fileName: string) => {
        if (!confirm(`"${fileName}" dosyasını silmek istediğinize emin misiniz?`)) return;

        try {
            await api.delete(`/api/admin/files?file_path=${encodeURIComponent(filePath)}`);
            toast.success('Dosya silindi');
            fetchFiles();
        } catch {
            toast.error('Dosya silinemedi');
        }
    };

    const handleDownload = async (filePath: string, fileName: string) => {
        try {
            const { data } = await api.get(`/api/admin/files/url?file_path=${encodeURIComponent(filePath)}`);
            if (data.url) {
                const link = document.createElement('a');
                link.href = data.url;
                link.download = fileName;
                link.target = '_blank';
                link.click();
            }
        } catch {
            toast.error('Dosya indirilemedi');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleUpload(e.dataTransfer.files);
    };

    const filteredFiles = files.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>📂 Dosya Yönetimi</h1>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {files.length} dosya
                </span>
            </div>

            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: category === cat.value ? '2px solid var(--primary-teal)' : '1px solid var(--neutral-gray-300)',
                            background: category === cat.value ? 'var(--primary-teal)' : 'transparent',
                            color: category === cat.value ? 'white' : 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: category === cat.value ? 600 : 400,
                            transition: 'all 0.2s',
                        }}
                    >
                        {cat.icon} {cat.label}
                    </button>
                ))}
            </div>

            {/* Upload Zone */}
            <motion.div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                animate={{ borderColor: dragOver ? 'var(--primary-teal)' : 'var(--neutral-gray-300)' }}
                style={{
                    border: '2px dashed',
                    borderRadius: '0.75rem',
                    padding: '2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    marginBottom: '1.5rem',
                    background: dragOver ? 'rgba(0, 128, 128, 0.05)' : 'transparent',
                    transition: 'background 0.2s',
                }}
                onClick={() => document.getElementById('file-input')?.click()}
            >
                <input
                    id="file-input"
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.csv"
                    style={{ display: 'none' }}
                    onChange={(e) => handleUpload(e.target.files)}
                />
                <Upload size={32} style={{ color: 'var(--primary-teal)', marginBottom: '0.5rem' }} />
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                    {uploading ? 'Yükleniyor...' : 'Dosya yüklemek için tıklayın veya sürükleyin'}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    JPG, PNG, WebP, PDF, CSV — Max 10MB
                </p>
            </motion.div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                    type="text"
                    placeholder="Dosya ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.25rem' }}
                />
            </div>

            {/* File List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    Yükleniyor...
                </div>
            ) : filteredFiles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <FolderOpen size={48} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                    <p>Bu kategoride dosya yok</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <AnimatePresence>
                        {filteredFiles.map((file) => (
                            <motion.div
                                key={file.path}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--neutral-gray-200)',
                                    background: 'var(--card-bg)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                                    <span style={{ color: 'var(--primary-teal)' }}>{getFileIcon(file.content_type)}</span>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontWeight: 500, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {file.name}
                                        </p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString('tr-TR')}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleDownload(file.path, file.name)}
                                        title="İndir"
                                        style={{
                                            padding: '0.4rem',
                                            border: 'none',
                                            background: 'rgba(0, 128, 128, 0.1)',
                                            borderRadius: '0.375rem',
                                            cursor: 'pointer',
                                            color: 'var(--primary-teal)',
                                        }}
                                    >
                                        <Download size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(file.path, file.name)}
                                        title="Sil"
                                        style={{
                                            padding: '0.4rem',
                                            border: 'none',
                                            background: 'rgba(220, 53, 69, 0.1)',
                                            borderRadius: '0.375rem',
                                            cursor: 'pointer',
                                            color: '#dc3545',
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
