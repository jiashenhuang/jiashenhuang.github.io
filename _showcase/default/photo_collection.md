---
show: true
width: 4
date: 2021-09-12 00:01:00 +0800
height: 295px
images:
- src: assets\images\etc\col1.jpg
  title: Me & Twanny
  # desc: Description 1.
  # link: https://picsum.photos/
- src: assets\images\etc\col2.jpg
  title: Blooming cherry blossoms at Wuhan University
  # desc: Description 2
- src: https://picsum.photos/seed/third33/800/800
---

{% include widgets/carousel.html id=page.id images=page.images height=page.height %}
