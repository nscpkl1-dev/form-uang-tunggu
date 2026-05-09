let allData = [];
const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbz-L7qkCv7HzSzFBxOpxy3KDwAjaWg-KO6KXUU9g1BD_s8tg2h7sHPVuLjetljmeRQO/exec";

// =====================
// DOM ELEMENT
// =====================
const formPage = document.getElementById("formPage");
const dataPage = document.getElementById("dataPage");

const sa = document.getElementById("sa");
const nama = document.getElementById("nama");
const nik = document.getElementById("nik");
const alamat = document.getElementById("alamat");
const nominal = document.getElementById("nominal");
const invoice = document.getElementById("invoice");
const kamera = document.getElementById("kamera");
const galeri = document.getElementById("galeri");
let ktpFile = null;
const loading = document.getElementById("loading");
const btnSubmit = document.querySelector(".submit");

// =====================
// MENU
// =====================
function showForm(){
    formPage.style.display = "block";
    dataPage.style.display = "none";
}

function showData(){
    formPage.style.display = "none";
    dataPage.style.display = "block";
    ambilData();
}

// =====================
// CANVAS (TTD)
// =====================
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let drawing = false;

// resize biar tidak blur di HP
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
window.addEventListener("load", resizeCanvas);

// mouse
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mouseup", stopDraw);
canvas.addEventListener("mouseleave", stopDraw);
canvas.addEventListener("mousemove", draw);

// touch (HP)
canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    startDraw(e.touches[0]);
});

canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    draw(e.touches[0]);
});

canvas.addEventListener("touchend", stopDraw);

function getPos(e){
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function startDraw(e){
    drawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function stopDraw(){
    drawing = false;
    ctx.beginPath();
}

function draw(e){
    if(!drawing) return;

    const pos = getPos(e);

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
}

function clearCanvas(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// =====================
// FORMAT RUPIAH
// =====================
nominal.addEventListener("input", function(e){
    let value = e.target.value.replace(/\D/g, "");
    e.target.value = new Intl.NumberFormat("id-ID").format(value);
});

// =====================
// NOTIF
// =====================
function showNotif(message, type){
    let notif = document.getElementById("notif");

    notif.innerText = message;
    notif.className = type;
    notif.style.display = "block";

    setTimeout(() => {
        notif.style.display = "none";
    }, 3000);
}

function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// =====================
// RESET FORM
// =====================
function resetForm(){
    sa.value = "";
    nama.value = "";
    nik.value = "";
    alamat.value = "";
    nominal.value = "";
    invoice.value = "";
    document.getElementById("metode").value = "";
    document.getElementById("bank").value = "";
    document.getElementById("noRek").value = "";

    document.getElementById("bankContainer").style.display = "none";
    document.getElementById("noRekContainer").style.display = "none";

    kamera.value = "";
galeri.value = "";
ktpFile = null; // 🔥 reset file

document.getElementById("btnUpload").innerText =
    "Upload KTP";

document.getElementById("previewKTP").style.display = "none";

clearCanvas();
}

// =====================
// KIRIM DATA
// =====================
async function kirimData(){

    // VALIDASI AWAL
if(
    !sa.value ||
    !nama.value ||
    !nik.value ||
    !alamat.value ||
    !nominal.value ||
    !invoice.value
){
    Swal.fire({
        icon: "warning",
        title: "Data Belum Lengkap",
        text: "Semua field wajib diisi!"
    });

    return;
}

    // =========================
    // 🔥 TAMBAHKAN DI SINI
    // =========================
    let metode = document.getElementById("metode").value;
    let bank = document.getElementById("bank").value;
    let noRek = document.getElementById("noRek").value;

    let rekening = "";

    if(metode === "CASH"){
        rekening = "CASH";
    } else {
        if(bank === "" || noRek === ""){
            showNotif("Lengkapi data transfer!", "error");
            return;
        }
        rekening = bank + "-" + noRek;
    }
    // =========================

    let ttd = canvas.toDataURL();

    let ktpBase64 = "";

    // VALIDASI KTP
    if(!ktpFile){
        showNotif("Upload KTP wajib!", "error");
        return;
    }

    ktpBase64 = await getBase64(ktpFile);

    // loading
    showLoading();

    // kirim data
    fetch(URL_SCRIPT, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
            sa: sa.value,
            nama: nama.value,
            nik: nik.value,
            alamat: alamat.value,
            nominal: nominal.value.replace(/\./g, ""),
            invoice: invoice.value,

            // 🔥 GANTI INI
            rekening: rekening,

            ttd: ttd,
            ktp: ktpBase64
        })
    })
    .then(() => {
        hideLoading();
        showNotif("Data berhasil dikirim!", "success");
        resetForm();
    })
    .catch(err => {
        console.error(err);
        hideLoading();
        showNotif("Gagal mengirim data!", "error");
    });
}
// =====================
// AMBIL DATA
// =====================
function ambilData(){
    fetch(URL_SCRIPT)
    .then(res => res.json())
    .then(data => {
        allData = data; // simpan data
        tampilkanData(data); // 🔥 pakai 1 function saja
    });
}

// PREVIEW DARI KAMERA
kamera.addEventListener("change", function(){

    if(!this.files.length) return;

ktpFile = this.files[0];

document.getElementById("btnUpload").innerText =
    ktpFile.name;

if(ktpFile){
        const reader = new FileReader();

        reader.onload = function(e){

            const preview = document.getElementById("previewKTP");

            preview.src = e.target.result;
            preview.style.display = "block";

        }

        reader.readAsDataURL(ktpFile);
    }

});

// PREVIEW DARI GALERI
galeri.addEventListener("change", function(){

if(!this.files.length) return;

ktpFile = this.files[0];

document.getElementById("btnUpload").innerText =
    ktpFile.name;

if(ktpFile){

        const reader = new FileReader();

        reader.onload = function(e){

            const preview = document.getElementById("previewKTP");

            preview.src = e.target.result;
            preview.style.display = "block";

        }

        reader.readAsDataURL(ktpFile);
    }

});

function tampilkanData(data){
    let table = document.getElementById("tableData");

  table.innerHTML =
"<tr><th>Tanggal</th><th>SA</th><th>Nama</th><th>NIK</th><th>Rekening</th><th>Invoice</th><th>Nominal</th><th>KTP</th><th>TTD</th></tr>";

    data.forEach(d => {
    console.log  ("Tanggal dari server:", d.tanggal);
    console.log("KTP:", d.ktp);
    let row = table.insertRow();

    // Tanggal
row.insertCell(0).setAttribute("data-label", "Tanggal");
let tgl = "";

if(d.tanggal && d.tanggal.includes("-")){
    let parts = d.tanggal.substring(0,10).split("-");
    tgl = parts[2] + "/" + parts[1] + "/" + parts[0];
}
row.cells[0].innerHTML = tgl;

// SA
row.insertCell(1).setAttribute("data-label", "SA");
row.cells[1].innerHTML = d.sa;

// Nama
row.insertCell(2).setAttribute("data-label", "Nama");
row.cells[2].innerHTML = d.nama;

// NIK
row.insertCell(3).setAttribute("data-label", "NIK");
row.cells[3].innerHTML = d.nik;

// 🔥 Rekening
row.insertCell(4).setAttribute("data-label", "Rekening");
row.cells[4].innerHTML = d.rekening || "-";


// 🔥 Invoice
row.insertCell(5).setAttribute("data-label", "Invoice");
row.cells[5].innerHTML = d.invoice || "-";

// Nominal
row.insertCell(6).setAttribute("data-label", "Nominal");
row.cells[6].innerHTML =
    "Rp " + new Intl.NumberFormat("id-ID").format(d.nominal);

// KTP
row.insertCell(7).setAttribute("data-label", "KTP");
row.cells[7].innerHTML = d.ktp 
    ? `<a href="${d.ktp}" target="_blank">Lihat</a>` 
    : "-";

// TTD
row.insertCell(8).setAttribute("data-label", "TTD");
row.cells[8].innerHTML =
    "<img src='"+d.ttd+"' width='80'>";
});
}

function filterData(){
    let selectedSA = document.getElementById("filterSA").value;
    let metode = document.getElementById("filterMetode").value;

    let tglAwal = document.getElementById("filterTanggalAwal").value;
    let tglAkhir = document.getElementById("filterTanggalAkhir").value;

    let filtered = allData.filter(d => {

        let matchSA = selectedSA === "" || d.sa === selectedSA;

        let tglData = d.tanggal ? d.tanggal.substring(0,10) : null;
        if(!tglData) return false;

        let matchTanggal = true;

        if(tglAwal && tglAkhir){
            matchTanggal = tglData >= tglAwal && tglData <= tglAkhir;
        } else if(tglAwal){
            matchTanggal = tglData >= tglAwal;
        } else if(tglAkhir){
            matchTanggal = tglData <= tglAkhir;
        }

        // 🔥 PINDAHKAN KE SINI (SEBELUM RETURN)
        let matchMetode = true;

        if(metode === "CASH"){
            matchMetode = d.rekening === "CASH";
        } else if(metode === "TRANSFER"){
            matchMetode = d.rekening !== "CASH";
        }

        // 🔥 RETURN PALING BAWAH
        return matchSA && matchTanggal && matchMetode;
    });

    tampilkanData(filtered);
}


function showLoading(){
    document.getElementById("overlay").style.display = "flex";

    // disable semua input
    document.querySelectorAll("input, select, button").forEach(el => {
        el.disabled = true;
    });
}

function hideLoading(){
    document.getElementById("overlay").style.display = "none";

    // enable kembali
    document.querySelectorAll("input, select, button").forEach(el => {
        el.disabled = false;
    });
}

function handleMetode(){
    let metode = document.getElementById("metode").value;

    let bankDiv = document.getElementById("bankContainer");
    let rekDiv = document.getElementById("noRekContainer");

    if(metode === "TRANSFER"){
        bankDiv.classList.remove("hidden");
    } else {
        bankDiv.classList.add("hidden");
        rekDiv.style.display = "none";

        document.getElementById("bank").value = "";
        document.getElementById("noRek").value = "";
    }
}

function handleBank(){
    let bank = document.getElementById("bank").value;
    let rekDiv = document.getElementById("noRekContainer");

    if(bank !== ""){
        rekDiv.style.display = "block";
    } else {
        rekDiv.style.display = "none";
        document.getElementById("noRek").value = "";
    }
}


function exportPDF(){

    const { jsPDF } = window.jspdf;
    let doc = new jsPDF("p", "mm", "a4");

    // =========================
    // HEADER
    // =========================
    doc.setFontSize(14);
    doc.text("LAPORAN UANG TUNGGU CUSTOMER", 14, 15);

    doc.setFontSize(10);
    let today = new Date().toLocaleDateString("id-ID");
    doc.text("Tanggal Export: " + today, 14, 22);

    // =========================
    // AMBIL FILTER
    // =========================
    let selectedSA = document.getElementById("filterSA").value;
    let metode = document.getElementById("filterMetode").value;
    let tglAwal = document.getElementById("filterTanggalAwal").value;
    let tglAkhir = document.getElementById("filterTanggalAkhir").value;

    // =========================
    // FILTER DATA
    // =========================
    let data = allData.filter(d => {

        let matchSA = selectedSA === "" || d.sa === selectedSA;

        let tglData = d.tanggal ? d.tanggal.substring(0,10) : null;
        if(!tglData) return false;

        let matchTanggal = true;

        if(tglAwal && tglAkhir){
            matchTanggal = tglData >= tglAwal && tglData <= tglAkhir;
        } else if(tglAwal){
            matchTanggal = tglData >= tglAwal;
        } else if(tglAkhir){
            matchTanggal = tglData <= tglAkhir;
        }

        let matchMetode = true;

        if(metode === "CASH"){
            matchMetode = d.rekening === "CASH";
        } else if(metode === "TRANSFER"){
            matchMetode = d.rekening !== "CASH";
        }

        return matchSA && matchTanggal && matchMetode;
    });

    // =========================
    // SIAPKAN DATA TABLE
    // =========================
    let rows = [];

    data.forEach(d => {

        let tgl = "";
        if(d.tanggal){
            let parts = d.tanggal.substring(0,10).split("-");
            tgl = parts[2] + "/" + parts[1] + "/" + parts[0];
        }

      rows.push([
    tgl,
    d.sa,
    d.nama,
    d.nik,
    d.rekening || "-",
    d.invoice || "-", // 🔥 TAMBAH
    "Rp " + new Intl.NumberFormat("id-ID").format(d.nominal),
    "" // TTD kosong (tetap)
    ]);
    });

    // =========================
    // BUAT TABLE + TTD
    // =========================
    doc.autoTable({
        startY: 30,

        head: [["Tanggal","SA","Nama","NIK","Rekening","Invoice","Nominal","TTD"]],
        body: rows,

        styles: {
            fontSize: 8,
            cellPadding: 2,
            minCellHeight: 12,
            valign: "middle", 
        },

        headStyles: {
            fillColor: [0,102,204],
            textColor: 255,
            halign: "center"
        },

      columnStyles: {
    0: { halign: "center" }, // tanggal
    1: { halign: "center" }, // SA
    2: { halign: "center" }, // nama (lebih bagus kiri)
    3: { halign: "center" }, // NIK
    4: { halign: "center" }, // rekening
    5: { halign: "center" }, // 🔥 invoice
    6: { halign: "center" },  // 🔥 nominal (lebih profesional kanan)
    7: { halign: "center", cellWidth: 30 } // 🔥 TTD (geser dari 6 ke 7)
},

didDrawCell: function (dataCell) {

    // 🔥 WAJIB: hanya body (bukan header)
    if (dataCell.section === "body" && dataCell.column.index === 7) {

        let rowIndex = dataCell.row.index;
        let ttd = data[rowIndex].ttd;

        if (
            ttd &&
            typeof ttd === "string" &&
            ttd.includes("base64")
        ) {
            try {
                let imgWidth = 20;
                let imgHeight = 10;

                let x = dataCell.cell.x + (dataCell.cell.width - imgWidth) / 2;
                let y = dataCell.cell.y + (dataCell.cell.height - imgHeight) / 2;

                doc.addImage(ttd, "PNG", x, y, imgWidth, imgHeight);
            } catch (e) {
                console.log("TTD error:", e);
            }
        }
    }
}
    });


let pageWidth = doc.internal.pageSize.width;
let pageHeight = doc.internal.pageSize.height;

// margin bawah aman (biar tidak kepotong printer)
let bottomMargin = 25;

// posisi garis (naik sedikit dari bawah)
let yLine = pageHeight - bottomMargin;

// panjang garis
let lineWidth = 60;

// kiri
let leftX = 20;
doc.line(leftX, yLine, leftX + lineWidth, yLine);

// teks tepat di bawah garis & center
doc.text(
  "ADMINISTRATION SECTION HEAD",
  leftX + lineWidth / 2,
  yLine + 6,
  { align: "center" }
);

// kanan
let rightX = pageWidth - lineWidth - 20;
doc.line(rightX, yLine, rightX + lineWidth, yLine);

doc.text(
  "SERVICE SECTION HEAD",
  rightX + lineWidth / 2,
  yLine + 6,
  { align: "center" }
);
    // =========================
    // SIMPAN PDF
    // =========================
    doc.save("Laporan-Uang-Tunggu.pdf");
}


function exportExcel(){

    let selectedSA = document.getElementById("filterSA").value;
    let metode = document.getElementById("filterMetode").value;
    let tglAwal = document.getElementById("filterTanggalAwal").value;
    let tglAkhir = document.getElementById("filterTanggalAkhir").value;

    let data = allData.filter(d => {

        let matchSA = selectedSA === "" || d.sa === selectedSA;

        let tglData = d.tanggal ? d.tanggal.substring(0,10) : null;
        if(!tglData) return false;

        let matchTanggal = true;

        if(tglAwal && tglAkhir){
            matchTanggal = tglData >= tglAwal && tglData <= tglAkhir;
        } else if(tglAwal){
            matchTanggal = tglData >= tglAwal;
        } else if(tglAkhir){
            matchTanggal = tglData <= tglAkhir;
        }

        let matchMetode = true;

        if(metode === "CASH"){
            matchMetode = d.rekening === "CASH";
        } else if(metode === "TRANSFER"){
            matchMetode = d.rekening !== "CASH";
        }

        return matchSA && matchTanggal && matchMetode;
    });

    let excelData = data.map(d => {

        let tgl = "";
        if(d.tanggal){
            let parts = d.tanggal.substring(0,10).split("-");
            tgl = parts[2] + "/" + parts[1] + "/" + parts[0];
        }

        return {
            "Tanggal": tgl,
            "SA": d.sa,
            "Nama": d.nama,
            "NIK": d.nik,
            "Rekening": d.rekening || "-",
            "Invoice": d.invoice || "-",
            "Nominal": d.nominal,
            "KTP": d.ktp || "-"
        };
    });

    let wb = XLSX.utils.book_new();
    let ws = XLSX.utils.json_to_sheet(excelData);

    let range = XLSX.utils.decode_range(ws['!ref']);

    for(let i = 0; i < data.length; i++){

    let cellAddress = XLSX.utils.encode_cell({ r: i + 1, c: 7 }); // +1 karena header

    let url = data[i].ktp;

    if(url){
        ws[cellAddress] = {
            t: 's',
            f: `HYPERLINK("${url}","Lihat KTP")`
        };
    }
}

    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, "Laporan-Uang-Tunggu.xlsx");
}

function confirmClear(){

    let yakin = confirm("Apakah yakin ingin menghapus tanda tangan?");

    if(yakin){
        clearCanvas();
    }
}
function confirmKirim(){

    Swal.fire({
        title: "Apakah Data Sudah Benar?",
        text: "Pastikan seluruh data yang diisi sudah sesuai.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#27ae60",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Ya, Kirim",
        cancelButtonText: "Periksa Lagi"
    }).then((result) => {

        if(result.isConfirmed){
            kirimData();
        }

    });
}

document.getElementById("btnUpload").addEventListener("click", () => {

    Swal.fire({
        title: "Pilih Sumber Foto",
        showDenyButton: true,
        showCancelButton: true,

        confirmButtonText: "Kamera",
        denyButtonText: "Galeri"

    }).then((result) => {

        if(result.isConfirmed){
            kamera.click();
        }

        else if(result.isDenied){
            galeri.click();
        }

    });

});