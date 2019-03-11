from tkinter import *
from datetime import datetime


class BatteryGraph:
    def __init__(self, root, callbacks: dict, **kwargs):
        self.callback = callbacks.get('battery', lambda: 0.0)

        self.root = root
        self.root.configure(background='#CCC')
        self.root.grid_columnconfigure(0, weight=1)
        self.root.grid_rowconfigure(0, weight=1)
        self.root.grid_rowconfigure(1, weight=8)
        self.root.after(1000, self.draw)

        Label(self.root, text='Battery Vmax%', background='#CCC', font=('Helvetica', 20,)) \
            .grid(row=0, column=0)

        self.canvas = Canvas(self.root)
        self.canvas.configure(background='#CCC')
        self.canvas.grid(row=1, column=0, sticky='nsew')

        self.dim = (1, 1)
        self.max_h = 1

        self.bar = self.canvas.create_rectangle(0, 0, 0, 0, fill='blue')
        self.bar_text = self.canvas.create_text((0, 0), text="", anchor=S, fill='white', font=('Helvetica', 30,))

        self.max_text = self.canvas.create_text((0, 0), text="100%", anchor=SW, fill='green')
        self.max_line = self.canvas.create_line((0, 0, 0, 0), fill='green', dash=(4, 2))

    def draw(self):
        self.dim = self.canvas.winfo_width(), self.canvas.winfo_height()
        self.max_h = self.dim[1] * .25

        self.draw_bar()
        self.draw_max_line()
        self.canvas.after(1000, self.draw)

    def draw_max_line(self):
        h = self.max_h
        self.canvas.coords(self.max_text, 0, h)
        self.canvas.coords(self.max_line, 0, h, self.dim[0], h)

    def draw_bar(self):
        v = self.callback()
        h = self.dim[1] - (self.dim[1] - self.max_h) * v
        self.canvas.coords(self.bar, self.dim[0]*0.25, h, self.dim[0] * .75, self.dim[1])
        self.canvas.coords(self.bar_text, self.dim[0] * .5, self.dim[1])
        self.canvas.itemconfigure(self.bar_text, text='%.0f%%' % (v * 100))


class Clock:
    def __init__(self, root, **kwargs):
        self.root = root
        self.root.configure(background='#CCC')
        self.root.after(1000, self.draw)

        self.time_str = StringVar()
        Label(self.root, textvariable=self.time_str, background='#CCC', font=('Helvetica', 60,)).pack(expand=True)

    def draw(self):
        now = datetime.now()
        self.time_str.set(now.strftime('%H:%M:%S'))

        self.root.after(1000, self.draw)


class Status:
    def __init__(self, root, callbacks: dict, **kwargs):
        self.callback = callbacks.get('status', lambda: ('black', 'Unknown'))

        self.root = root
        self.root.configure(background='gray')
        self.root.after(1000, self.draw)

        self.time_str = StringVar()
        self.lbl_description = Label(self.root, text="CONNECTION:", background='gray', fg='white', font=('Helvetica', 15, 'underline'))
        self.lbl_description.place(relx=0)
        self.lbl_status = Label(self.root, textvariable=self.time_str, background='gray', fg='white', font=('Helvetica', 30,))
        self.lbl_status.pack(expand=True)

    def draw(self):
        color, status = self.callback()

        self.time_str.set(status)
        self.root.configure(background=color)
        self.lbl_description.configure(background=color)
        self.lbl_status.configure(background=color)
        self.root.after(1000, self.draw)


class View:
    def __init__(self, root: Tk, **kwargs):
        self.root = root
        self.root.bind("<Escape>", self.quit)
        self.root.bind("x", self.quit)

        self.content = Frame(self.root)
        self.content.configure(background='#DDD')
        for i in range(3):
            self.content.grid_columnconfigure(i, weight=1, uniform="uni_1")
        for i in range(2):
            self.content.grid_rowconfigure(i, weight=1, uniform="uni_2")
        self.content.pack(fill='both', expand=True)

        f = Frame(self.content)
        f.grid(row=0, column=0, rowspan=2, sticky='nsew', padx=(10, 10))
        self.battery = BatteryGraph(f, **kwargs)

        f = Frame(self.content)
        f.grid(row=0, column=1, columnspan=2, sticky='nsew')
        self.clock = Clock(f, **kwargs)

        f = Frame(self.content)
        f.grid(row=1, column=1, columnspan=2, sticky='nsew')
        self.status = Status(f, **kwargs)

        self.root.mainloop()

    def quit(self, *args):
        self.root.destroy()
