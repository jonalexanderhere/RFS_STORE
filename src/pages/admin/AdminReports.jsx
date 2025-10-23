import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, TrendingUp, DollarSign, Package, Users, Calendar } from 'lucide-react'
import { getStatistics, supabase } from '../../lib/supabase'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { id } from 'date-fns/locale'
import toast from 'react-hot-toast'

const AdminReports = () => {
  const [stats, setStats] = useState(null)
  const [monthlyData, setMonthlyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    loadReportData()
  }, [period])

  const loadReportData = async () => {
    try {
      const statsData = await getStatistics()
      setStats(statsData)

      // Get monthly revenue data
      const startDate = period === 'month' 
        ? startOfMonth(new Date())
        : startOfYear(new Date())
      
      const endDate = period === 'month'
        ? endOfMonth(new Date())
        : endOfYear(new Date())

      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('status', 'paid')
        .gte('paid_at', startDate.toISOString())
        .lte('paid_at', endDate.toISOString())

      setMonthlyData(invoicesData || [])
    } catch (error) {
      toast.error('Gagal memuat data laporan: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const exportToCSV = () => {
    if (monthlyData.length === 0) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }

    const headers = ['Tanggal', 'No. Invoice', 'Pelanggan', 'Layanan', 'Total', 'Status']
    const rows = monthlyData.map(inv => [
      format(new Date(inv.paid_at), 'dd/MM/yyyy HH:mm'),
      inv.invoice_number,
      inv.user_id,
      inv.service_type,
      inv.total_amount,
      inv.status
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `laporan_${period}_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()

    toast.success('Laporan berhasil diunduh')
  }

  const totalRevenuePeriod = monthlyData.reduce((sum, inv) => sum + Number(inv.total_amount), 0)
  const averageTransaction = monthlyData.length > 0 ? totalRevenuePeriod / monthlyData.length : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Laporan Keuangan
              </h1>
              <p className="text-gray-200">
                Data transaksi dan statistik bisnis
              </p>
            </div>
            <div className="flex gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
              >
                <option value="month" className="bg-gray-800">Bulan Ini</option>
                <option value="year" className="bg-gray-800">Tahun Ini</option>
              </select>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                <Download size={20} />
                Export CSV
              </button>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-effect rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <DollarSign size={32} className="text-green-400" />
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <p className="text-gray-300 text-sm mb-2">Total Pendapatan</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(stats?.totalRevenue || 0)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-effect rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Package size={32} className="text-blue-400" />
              <TrendingUp size={20} className="text-blue-400" />
            </div>
            <p className="text-gray-300 text-sm mb-2">Total Transaksi</p>
            <p className="text-2xl font-bold text-white">
              {monthlyData.length}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-effect rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <DollarSign size={32} className="text-purple-400" />
              <Calendar size={20} className="text-purple-400" />
            </div>
            <p className="text-gray-300 text-sm mb-2">Rata-rata Transaksi</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(averageTransaction)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-effect rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Users size={32} className="text-yellow-400" />
              <TrendingUp size={20} className="text-yellow-400" />
            </div>
            <p className="text-gray-300 text-sm mb-2">Total Pengguna</p>
            <p className="text-2xl font-bold text-white">
              {stats?.totalUsers || 0}
            </p>
          </motion.div>
        </div>

        {/* Revenue Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-effect rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp size={24} />
              Detail Transaksi {period === 'month' ? 'Bulan Ini' : 'Tahun Ini'}
            </h2>
          </div>
          
          {monthlyData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-white font-semibold">Tanggal</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">No. Invoice</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Layanan</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Total</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-t border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {format(new Date(invoice.paid_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                      </td>
                      <td className="px-6 py-4 text-white font-mono text-sm">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-6 py-4 text-gray-300">{invoice.service_type}</td>
                      <td className="px-6 py-4 text-green-400 font-semibold">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-semibold">
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-white/5 border-t-2 border-blue-400">
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-white font-bold text-lg">
                      Total
                    </td>
                    <td className="px-6 py-4 text-green-400 font-bold text-lg">
                      {formatCurrency(totalRevenuePeriod)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Package size={64} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                Tidak ada transaksi
              </h3>
              <p className="text-gray-300">
                Belum ada transaksi pada periode ini
              </p>
            </div>
          )}
        </motion.div>

        {/* Additional Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
        >
          <div className="glass-effect rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4">Status Pesanan</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Selesai</span>
                <span className="text-green-400 font-semibold">{stats?.completedOrders || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Aktif</span>
                <span className="text-blue-400 font-semibold">{stats?.activeOrders || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total</span>
                <span className="text-white font-semibold">{stats?.totalOrders || 0}</span>
              </div>
            </div>
          </div>

          <div className="glass-effect rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4">Pembayaran</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Menunggu Verifikasi</span>
                <span className="text-yellow-400 font-semibold">{stats?.pendingPayments || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Terverifikasi</span>
                <span className="text-green-400 font-semibold">{monthlyData.length}</span>
              </div>
            </div>
          </div>

          <div className="glass-effect rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4">Pengguna</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Total Pengguna</span>
                <span className="text-white font-semibold">{stats?.totalUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Pengguna Baru (Bulan Ini)</span>
                <span className="text-blue-400 font-semibold">{stats?.newUsersThisMonth || 0}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminReports

