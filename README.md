# Landscape Case Atlas

เว็บไซต์คลังกรณีศึกษางานภูมิสถาปัตยกรรมทั่วโลก มี 3 หน้า:
- `index.html` — แผนที่ลูกโลก กดหมุดเพื่อดูการ์ดโครงการ
- `cases.html` — ตารางกรณีศึกษา เรียงตามปี/พื้นที่/งานวิจัย ฯลฯ กรองตามภูมิภาค ประเทศ ประเภทงาน ดาวน์โหลด CSV ได้
- `project.html?id=…` — หน้ารายละเอียด: ผัง แบบ ภาพ งานวิจัย บันทึกการอัปเดต

## เปิดดูเว็บไซต์
ออนไลน์ที่ **https://nakrobmee.github.io/landscape-case-atlas/** (GitHub Pages อัปเดตเองทุกครั้งที่มีการ push เข้า `main`)
ดูในเครื่อง: รัน `python3 -m http.server 8765` ในโฟลเดอร์นี้ แล้วเปิด http://localhost:8765

## งานอัตโนมัติ (Claude cloud routines — ทำงานแม้ปิดเครื่อง)
| งาน | เวลา (กรุงเทพฯ) | คำสั่ง | ทำอะไร |
|---|---|---|---|
| Daily research | ทุกวัน 09:00 | `routines/daily-research.md` | อ่านลิงก์จากแอป Inbox และ `inbox.md` ก่อน → ค้นงานใหม่ทั่วโลก 5 ชิ้น เก็บไว้ใน `staging/` |
| Sunday publish | วันอาทิตย์ 10:00 | `routines/sunday-publish.md` | นำงานใน `staging/` ขึ้นเว็บ + อัปเดตงานเดิมจากลิงก์ของผู้ใช้ + สถานะในแอป |
| Monthly update | วันที่ 1 ของเดือน 08:00 | `routines/monthly-update.md` | ตรวจทานงานเดิมสูงสุด 30 โครงการ/เดือน |

แต่ละรอบจะ commit แล้ว push เข้า `main` เอง จัดการ routine ได้ที่ https://claude.ai/code/routines
แก้วิธีทำงานได้โดยแก้ไฟล์ใน `routines/` (รอบถัดไปจะใช้เวอร์ชันใหม่)

## ส่งลิงก์ที่น่าสนใจ
ช่องทางหลัก: แอป "Landscape Atlas Inbox" บน claude.ai (https://claude.ai/artifact/HmcWcvGgo7ydTYZqEBjgcy) วางลิงก์แล้วกดเพิ่ม ดูสถานะของแต่ละลิงก์ได้ในแอป

ช่องทางสำรอง: แก้ไฟล์ `inbox.md` บน GitHub (แอปมือถือหรือเว็บ → ไอคอนดินสอ) วางลิงก์ใต้หัวข้อ "รอดำเนินการ" บรรทัดละลิงก์ ขึ้นต้นด้วย `- ` ใส่โน้ตหลัง `|` ได้ แล้ว Commit
งานรายวันจะหยิบไปทำก่อน แล้วย้ายลิงก์ไปหัวข้อที่ตรงกับผลลัพธ์

ถ้าแก้ไฟล์ในเครื่องนี้ ให้ `git pull` ก่อนแก้ และ `git push` หลังแก้ เพราะ routine บน cloud ก็แก้ไฟล์ชุดเดียวกัน

## โครงสร้าง
- `data/projects.json` — ข้อมูลต้นฉบับ (แก้ไขที่นี่)
- `tools/ig_read.js` — อ่านโพสต์ Instagram สาธารณะ (แคปชัน บัญชี สถานที่) ให้งานรายวัน: `node tools/ig_read.js <ลิงก์>` (ต้องเปิดให้ environment เข้า instagram.com ได้)
- `tools/build.py` — ตรวจข้อมูลและสร้าง `data/projects.js` (+ ไฟล์ KML/CSV ใน `exports/`)
- `assets/` — สไตล์ ฟังก์ชันร่วม และค่าแผนที่ (Mapbox token ใน `config.js`)
- ฟิลด์ที่งานรายเดือนเพิ่ม: `last_reviewed`, `updated_date`, `updates` [{date, note_th}]; ภาพมี `year` ได้
