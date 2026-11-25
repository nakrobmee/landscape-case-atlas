# staging — โครงการที่ค้นแล้ว รอขึ้นเว็บ

- งานรายวัน (หาข้อมูล 5 โครงการ/วัน) เขียนไฟล์ `staging/<YYYY-MM-DD>.json` (JSON array ตาม schema เดียวกับ data/projects.json) และ **ไม่แตะ** data/projects.json / ไม่รัน build.py
- งานวันอาทิตย์ นำทุกไฟล์ในโฟลเดอร์นี้เข้า data/projects.json แล้วรัน tools/build.py จากนั้นย้ายไฟล์ไป `staging/archive/`
- `state.json` เก็บบันทึกประวัติการทำงาน (ไม่มีการจำกัดปีแล้ว — ค้นโครงการได้ทุกปี)
- `inbox_updates.json` คือการอัปเดตโครงการเดิมจากลิงก์ใน inbox ที่รอทำในวันอาทิตย์
