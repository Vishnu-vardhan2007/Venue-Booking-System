package com.venueverse.service;

import com.venueverse.exception.GlobalExceptionHandler.BookingCheckException;
import com.venueverse.exception.GlobalExceptionHandler.SlotConflictException;
import org.springframework.stereotype.Service;

@Service
public class BookingConcurrencyManager {

    private static int workersStarted = 0;
    private final Object lock = new Object();
    private int bookingCount = 0;
    private String lastLog = "";

    private static synchronized void addWorkers(int count) {
        workersStarted += count;
    }

    public static synchronized int getWorkersStarted() {
        return workersStarted;
    }

    public synchronized int incrementBookingCount() {
        bookingCount++;
        return bookingCount;
    }

    public synchronized int getBookingCount() {
        return bookingCount;
    }

    public String getLastLog() {
        synchronized (lock) {
            return lastLog;
        }
    }

    public class AuditThread extends Thread {
        private final String bookingId;
        public Thread.State sleepState = State.NEW;

        public AuditThread(String bookingId) {
            super("Audit-" + bookingId);
            this.bookingId = bookingId;
        }

        @Override
        public void run() {
            Thread.yield();
            try {
                sleepState = Thread.State.TIMED_WAITING;
                Thread.sleep(2);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            int count = incrementBookingCount();
            synchronized (lock) {
                lastLog = "AUDIT#" + count + ":" + bookingId;
            }
        }
    }

    public class SyncTask implements Runnable {
        private final String venueId;

        public SyncTask(String venueId) {
            this.venueId = venueId;
        }

        @Override
        public void run() {
            Thread.yield();
            try {
                Thread.sleep(1);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            synchronized (lock) {
                lastLog = "SYNC:" + venueId;
            }
        }
    }

    public String runAuditAndSync(String bookingId, String venueId) {
        AuditThread t1 = new AuditThread(bookingId);
        Thread t2 = new Thread(new SyncTask(venueId), "Sync-" + venueId);
        Thread.State startState = t1.getState();

        addWorkers(2);
        t1.start();
        t2.start();
        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return startState + "->" + t1.sleepState + "->" + t1.getState();
    }

    public void recordAsync(String bookingId) {
        AuditThread t = new AuditThread(bookingId);
        t.setDaemon(true);
        t.start();
    }

    public void validateSlot(String venueId, boolean fail) throws BookingCheckException {
        synchronized (lock) {
            if (venueId == null || venueId.isBlank()) {
                throw new BookingCheckException("Venue ID is blank");
            }
            if (fail) {
                throw new SlotConflictException("Slot busy for " + venueId);
            }
            lastLog = "VALID:" + venueId;
        }
    }

    public String safeValidateSlot(String venueId, boolean fail) {
        try {
            validateSlot(venueId, fail);
            return "OK:" + venueId;
        } catch (SlotConflictException e) {
            return "DERIVED_CAUGHT:" + e.getMessage();
        } catch (BookingCheckException e) {
            return "BASE_CAUGHT:" + e.getMessage();
        } finally {
            synchronized (lock) {
                if (lastLog.isEmpty()) {
                    lastLog = "CLEANUP:" + venueId;
                }
            }
        }
    }
}
